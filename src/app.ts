import { CONFIG } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { readCookies } from "./utils/cookies.js";
import { readPagesFromCSV } from "./utils/csv.js";
import { PageParser } from "./parsers/page-parser.js";
import { EpubGenerator } from "./epub/generator.js";
import { defaultEpubMetadata } from "./types/index.js";
import { formatDuration } from "./utils/helpers.js";

class FastFounderParser {
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
      const parser = new PageParser(cookies);
      
      // Извлекаем URL из ParsedCSVRow
      const urls = pages.map(page => page.url);
      const parsedPages = await parser.parsePages(urls);

      if (parsedPages.length === 0) {
        throw new Error("Не удалось спарсить ни одной страницы");
      }

      logger.success(`Успешно спарсено ${parsedPages.length} страниц`);

      // Этап 4: Создание EPUB
      logger.info("Создаем EPUB документ...");
      const epubGenerator = new EpubGenerator();
      const outputPath = `./fastfounder-${CONFIG.isDev ? "dev" : "full"}.epub`;

      const epubResult = await epubGenerator.generateEpub(
        parsedPages,
        defaultEpubMetadata,
        outputPath
      );

      if (!epubResult.success) {
        throw new Error(`Ошибка создания EPUB: ${epubResult.error}`);
      }

      logger.success(`EPUB документ создан: ${epubResult.outputPath}`);

      // Финальная статистика
      const duration = Date.now() - startTime;
      logger.party("Парсинг завершен успешно!");
      logger.info(`Время выполнения: ${formatDuration(duration)}`);
      logger.info(`Обработано страниц: ${parsedPages.length}`);

      if (epubResult.fileSize) {
        logger.info(`Размер EPUB: ${epubResult.fileSize} байт`);
      }
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
  app.run().catch((error) => {
    logger.boom("Необработанная ошибка:", error);
    process.exit(1);
  });
}
