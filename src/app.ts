import { CONFIG } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { readCookies } from "./utils/cookies.js";
import { readPagesFromCSV } from "./utils/csv.js";
import { PageParser } from "./parsers/page-parser.js";
import { EpubGenerator } from "./epub/generator.js";
import { defaultEpubMetadata } from "./types/index.js";
import { formatDuration } from "./utils/helpers.js";
import { PageCache } from "./utils/cache.js";

class FastFounderParser {
  async clearCache(): Promise<void> {
    logger.info("🗑️  Очистка кеша страниц...");
    const cache = new PageCache();
    await cache.clearCache();
    logger.success("✅ Кеш очищен");
  }

  async run(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.rocket("Запуск парсера FastFounder");
      logger.info(
        `Режим: ${CONFIG.isDev ? "Разработка (3 страницы)" : "Полный парсинг"}`
      );

      // Этап 1: Загрузка cookies
      logger.info("Загружаем cookies...");
      const cookies = await readCookies(CONFIG.COOKIES_FILE);
      logger.success("Cookies загружены");

      // Этап 2: Чтение списка страниц
      logger.info("Читаем список страниц...");
      const limit = CONFIG.isDev ? CONFIG.DEV_PAGES_LIMIT : undefined;
      const pages = await readPagesFromCSV(CONFIG.CSV_FILE, limit);
      logger.success(`Загружено ${pages.length} ссылок`);

      logger.info(`Будет обработано ${pages.length} страниц`);

      // Этап 3: Парсинг страниц
      logger.info("Начинаем парсинг страниц...");
      const parser = new PageParser(cookies, CONFIG.contentFilter.enabled);

      // Извлекаем URL из ParsedCSVRow
      const urls = pages.map((page) => page.url);
      const parsedPages = await parser.parsePages(urls);

      if (parsedPages.length === 0) {
        throw new Error("Не удалось спарсить ни одной страницы");
      }

      logger.success(`Успешно спарсено ${parsedPages.length} страниц`);

      // Этап 4: Создание EPUB
      logger.info("Создаем EPUB документ...");
      const epubGenerator = new EpubGenerator();
      const basePath = `./results/fastfounder-${
        CONFIG.isDev ? "dev" : "full"
      }.epub`;

      const epubResult = await epubGenerator.generateMultiPartEpub(
        parsedPages,
        defaultEpubMetadata,
        basePath,
        CONFIG.epub.parts
      );

      if (!epubResult.success) {
        throw new Error(`Ошибка создания EPUB: ${epubResult.error}`);
      }

      if (epubResult.totalParts === 1) {
        logger.success(
          `EPUB документ создан: ${epubResult.parts[0].outputPath}`
        );
      } else {
        logger.success(`Создано ${epubResult.totalParts} частей EPUB:`);
        epubResult.parts.forEach((part) => {
          logger.info(
            `  📖 Часть ${part.partNumber}: ${part.outputPath} (${part.chaptersCount} глав)`
          );
        });
      }

      // Финальная статистика
      const duration = Date.now() - startTime;
      logger.party("Парсинг завершен успешно!");
      logger.info(`Время выполнения: ${formatDuration(duration)}`);
      logger.info(`Обработано страниц: ${parsedPages.length}`);
      logger.info(`Частей EPUB: ${epubResult.totalParts}`);
      logger.info(`Общий размер: ${epubResult.totalFileSize} байт`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.boom(`Критическая ошибка: ${errorMessage}`);
      logger.info(`Время до ошибки: ${formatDuration(duration)}`);

      process.exit(1);
    }
  }
}

// Запуск приложения (только если файл запущен напрямую)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const app = new FastFounderParser();

  // Проверяем аргументы командной строки
  if (process.argv.includes("--clear-cache")) {
    app.clearCache().catch((error) => {
      logger.boom("Ошибка очистки кеша:", error);
      process.exit(1);
    });
  } else {
    app.run().catch((error) => {
      logger.boom("Необработанная ошибка:", error);
      process.exit(1);
    });
  }
}
