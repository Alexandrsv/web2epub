import { PageData } from "../types/page.js";
import { CONFIG } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { sleep, retry } from "../utils/helpers.js";
import { decode } from "html-entities";

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
  parse(url: string, options?: { headers?: Record<string, string> }): Promise<PostlightParserResult>;
}

export class PageParser {
  private readonly cookies: string;
  private parser: PostlightParser | null = null;

  constructor(cookies: string) {
    this.cookies = cookies;
  }

  private async initializeParser(): Promise<void> {
    if (!this.parser) {
      const parserModule = await import("@postlight/parser");
      this.parser = parserModule.default as PostlightParser;
    }
  }

  private cleanHtmlContent(content: string): string {
    // НЕ удаляем HTML теги - сохраняем структуру для EPUB
    // Только очищаем нежелательные теги и скрипты
    return content
      .replace(/<script[^>]*>.*?<\/script>/gis, "") // Удаляем скрипты
      .replace(/<style[^>]*>.*?<\/style>/gis, "") // Удаляем стили
      .replace(/<!--.*?-->/gs, "") // Удаляем комментарии
      .replace(/\s+/g, " ") // Нормализуем пробелы
      .trim();
  }

  async parsePage(url: string): Promise<PageData> {
    await this.initializeParser();

    return retry(
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
  }

  async parsePages(urls: string[]): Promise<PageData[]> {
    const results: PageData[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        const pageData = await this.parsePage(url);
        results.push(pageData);

        logger.info(`✅ ${i + 1}/${urls.length}: ${pageData.title}`);

        // Задержка между запросами (кроме последнего)
        if (i < urls.length - 1) {
          await sleep(CONFIG.delays.betweenRequests);
        }
      } catch (error) {
        logger.error(`❌ Ошибка парсинга ${url}:`, error);
        // Продолжаем с остальными страницами
        continue;
      }
    }

    return results;
  }
}
