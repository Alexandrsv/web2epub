import EPub from "epub-gen";
import { promises as fs } from "fs";
import path from "path";
import type {
  PageData,
  EpubGenerationResult,
  EpubMetadata,
  EpubChapter,
} from "../types/index.js";
import { pageDataToChapter } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { formatBytes } from "../utils/helpers.js";

export class EpubGenerator {
  private readonly defaultCSS = `
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: bold;
    }
    
    h1 {
      font-size: 1.8em;
      border-bottom: 2px solid #3498db;
      padding-bottom: 0.3em;
    }
    
    h2 {
      font-size: 1.5em;
    }
    
    h3 {
      font-size: 1.3em;
    }
    
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
    
    blockquote {
      margin: 1.5em 0;
      padding: 1em;
      background-color: #f8f9fa;
      border-left: 4px solid #3498db;
      font-style: italic;
    }
    
    code {
      background-color: #f4f4f4;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: "Courier New", monospace;
    }
    
    pre {
      background-color: #f4f4f4;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
    }
    
    .chapter-meta {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-bottom: 1.5em;
      border-bottom: 1px solid #ecf0f1;
      padding-bottom: 0.5em;
    }
    
    .chapter-url {
      word-break: break-all;
    }
  `;

  private sortChaptersByDate(chapters: EpubChapter[]): EpubChapter[] {
    return [...chapters].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;

      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      return dateA.getTime() - dateB.getTime(); // Хронологический порядок (старые → новые)
    });
  }

  private formatChapterContent(chapter: EpubChapter): string {
    const metaInfo = [];

    if (chapter.date) {
      const date = new Date(chapter.date);
      const formattedDate = date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      metaInfo.push(`📅 ${formattedDate}`);
    }

    if (chapter.url) {
      metaInfo.push(`🔗 <span class="chapter-url">${chapter.url}</span>`);
    }

    const metaSection =
      metaInfo.length > 0
        ? `<div class="chapter-meta">${metaInfo.join(" • ")}</div>`
        : "";

    return `${metaSection}${chapter.content}`;
  }

  async generateEpub(
    pages: PageData[],
    metadata: EpubMetadata,
    outputPath: string
  ): Promise<EpubGenerationResult> {
    try {
      logger.book(`Создание EPUB документа: ${metadata.title}`);
      logger.info(`Страниц для включения: ${pages.length}`);
      logger.info(`Путь сохранения: ${outputPath}`);

      if (pages.length === 0) {
        throw new Error("Нет страниц для включения в EPUB");
      }

      // Преобразуем страницы в главы и сортируем по дате
      const chapters = pages.map((page) => pageDataToChapter(page));
      const sortedChapters = this.sortChaptersByDate(chapters);

      logger.info(`Главы отсортированы хронологически`);

      // Подготавливаем содержимое для epub-gen
      const epubContent = sortedChapters.map((chapter, index) => ({
        title: chapter.title,
        data: this.formatChapterContent(chapter),
        author: metadata.author,
        filename: `chapter-${index + 1}`,
      }));

      // Создаем директорию для вывода если не существует
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Конфигурация для epub-gen
      const epubOptions = {
        title: metadata.title,
        author: metadata.author,
        description:
          metadata.description || `Коллекция статей с ${pages.length} статьями`,
        language: metadata.language,
        publisher: metadata.publisher,
        cover: metadata.cover,
        css: this.defaultCSS,
        content: epubContent,

        // Дополнительные настройки
        appendChapterTitles: true,
        customOpfTemplatePath: undefined,
        customNcxToc: undefined,
        customHtmlToc: undefined,
        verbose: false,
      };

      logger.info("Генерация EPUB файла...");

      // Генерируем EPUB
      await new EPub(epubOptions, outputPath).promise;

      // Получаем размер созданного файла
      const stats = await fs.stat(outputPath);
      const fileSize = stats.size;

      logger.success(`EPUB документ создан успешно!`);
      logger.info(`Размер файла: ${formatBytes(fileSize)}`);
      logger.info(`Глав в документе: ${sortedChapters.length}`);

      return {
        success: true,
        outputPath,
        fileSize,
        chaptersCount: sortedChapters.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Ошибка создания EPUB: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
