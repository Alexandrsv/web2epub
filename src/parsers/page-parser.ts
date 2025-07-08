import { PageData } from "../types/page.js";
import { CONFIG } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { sleep, retry } from "../utils/helpers.js";
import { decode } from "html-entities";
import { PageCache } from "../utils/cache.js";
import {
  ContentFilter,
  createFastFounderFilter,
} from "../utils/content-filter.js";

interface PostlightParserResult {
  title?: string;
  content?: string;
  excerpt?: string;
  url?: string;
  domain?: string;
  word_count?: number;
  date_published?: string;
  author?: string;
  lead_image_url?: string;
}

interface PostlightParser {
  parse(
    url: string,
    options?: { headers?: Record<string, string> }
  ): Promise<PostlightParserResult>;
}

export class PageParser {
  private readonly cookies: string;
  private parser: PostlightParser | null = null;
  private cache: PageCache;
  private contentFilter: ContentFilter;

  constructor(cookies: string, useContentFilter = true) {
    this.cookies = cookies;
    this.cache = new PageCache();

    // Создаем фильтр контента если включен
    this.contentFilter = useContentFilter
      ? createFastFounderFilter()
      : new ContentFilter();

    if (useContentFilter) {
      logger.info(
        `🧹 Фильтр контента активен: ${this.contentFilter.getRulesCount()} правил`
      );
    }
  }

  private async initializeParser(): Promise<void> {
    if (!this.parser) {
      const parserModule = await import("@postlight/parser");
      this.parser = parserModule.default as PostlightParser;
    }
  }

  private cleanHtmlContent(content: string): string {
    // Сначала применяем фильтрацию контента
    let cleanedContent = this.contentFilter.filterContent(content);

    // Затем НЕ удаляем HTML теги - сохраняем структуру для EPUB
    // Только очищаем нежелательные теги и скрипты
    cleanedContent = cleanedContent
      .replace(/<script[^>]*>.*?<\/script>/gis, "") // Удаляем скрипты
      .replace(/<style[^>]*>.*?<\/style>/gis, "") // Удаляем стили
      .replace(/<!--.*?-->/gs, "") // Удаляем комментарии
      .replace(/\s+/g, " ") // Нормализуем пробелы
      .trim();

    return cleanedContent;
  }

  async parsePage(url: string): Promise<PageData> {
    // Проверяем кеш
    const cachedPage = await this.cache.getPage(url);
    if (cachedPage) {
      logger.debug(`📥 Страница из кеша: ${cachedPage.title}`);
      return cachedPage;
    }

    await this.initializeParser();

    const pageData = await retry(
      async () => {
        logger.debug(`Парсинг страницы: ${url}`);

        const result = await this.parser!.parse(url, {
          headers: {
            Cookie: this.cookies,
            "User-Agent": CONFIG.http.userAgent,
          },
        });

        // Сначала декодируем HTML entities в сыром контенте, потом очищаем
        const rawDecodedContent = decode(result.content || "");
        const cleanedContent = this.cleanHtmlContent(rawDecodedContent);

        const decodedTitle = decode(result.title || "");
        const decodedExcerpt = result.excerpt ? decode(result.excerpt) : "";

        const pageData: PageData = {
          title: decodedTitle,
          content: cleanedContent,
          excerpt: decodedExcerpt,
          url: result.url || url,
          domain: result.domain || "fastfounder.ru",
          wordCount: result.word_count || 0,
          datePublished: result.date_published || null,
          author: result.author || null,
          leadImageUrl: result.lead_image_url || null,
        };

        logger.debug(
          `Страница спарсена: ${pageData.title} (${pageData.wordCount} слов)`
        );
        return pageData;
      },
      CONFIG.retry.attempts,
      CONFIG.retry.delay
    );

    // Сохраняем в кеш
    await this.cache.setPage(url, pageData);
    return pageData;
  }

  async parsePages(urls: string[]): Promise<PageData[]> {
    // Статистика кеша
    const cacheStats = await this.cache.getCacheStats();
    if (cacheStats.totalPages > 0) {
      logger.info(`📥 В кеше: ${cacheStats.totalPages} страниц`);
    }

    // Проверяем какие страницы уже в кеше
    const uncachedUrls = await this.cache.getUncachedUrls(urls);
    const cachedPages = await this.cache.getCachedPages(urls);

    if (cachedPages.length > 0) {
      logger.info(`🎯 Из кеша загружено: ${cachedPages.length} страниц`);
    }

    if (uncachedUrls.length > 0) {
      logger.info(`🔄 Нужно спарсить: ${uncachedUrls.length} страниц`);
    } else {
      logger.success("🎉 Все страницы найдены в кеше!");
      return cachedPages;
    }

    const results: PageData[] = [...cachedPages];
    let parsedCount = 0;

    for (let i = 0; i < uncachedUrls.length; i++) {
      const url = uncachedUrls[i];

      try {
        const pageData = await this.parsePage(url);
        results.push(pageData);
        parsedCount++;

        logger.info(
          `✅ ${parsedCount}/${uncachedUrls.length}: ${pageData.title}`
        );

        // Сохраняем кеш каждые 5 страниц для безопасности
        if (parsedCount % 5 === 0) {
          await this.cache.saveCache();
          logger.debug(`💾 Кеш сохранен (${parsedCount} страниц)`);
        }

        // Задержка между запросами (кроме последнего)
        if (i < uncachedUrls.length - 1) {
          await sleep(CONFIG.delays.betweenRequests);
        }
      } catch (error) {
        logger.error(`❌ Ошибка парсинга ${url}:`, error);
        // Продолжаем с остальными страницами
        continue;
      }
    }

    // Финальное сохранение кеша
    await this.cache.saveCache();
    logger.info(`💾 Кеш обновлен: ${results.length} страниц`);

    return results;
  }
}
