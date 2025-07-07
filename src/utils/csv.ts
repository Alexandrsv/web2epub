import * as fs from "fs";
import { logger } from "./logger.js";

export class CSVError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CSVError";
  }
}

export interface ParsedCSVRow {
  url: string;
  timestamp: string;
}

export const readPagesFromCSV = async (
  filePath: string,
  limit?: number
): Promise<ParsedCSVRow[]> => {
  try {
    logger.debug(`Чтение CSV файла: ${filePath}`);

    const csvContent = await fs.promises.readFile(filePath, "utf-8");
    const lines = csvContent
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    if (lines.length === 0) {
      throw new CSVError("CSV файл пуст");
    }

    const pages: ParsedCSVRow[] = lines.map((line: string, index: number) => {
      const parts = line.split(",");

      if (parts.length < 2) {
        throw new CSVError(`Неверный формат строки ${index + 1}: ${line}`);
      }

      const url = parts[0].trim();
      const timestamp = parts[1].trim();

      if (!isValidUrl(url)) {
        throw new CSVError(`Неверный URL в строке ${index + 1}: ${url}`);
      }

      if (!isValidDate(timestamp)) {
        throw new CSVError(`Неверная дата в строке ${index + 1}: ${timestamp}`);
      }

      return { url, timestamp };
    });

    // Сортировка по дате для соблюдения хронологического порядка
    pages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Применяем лимит если указан
    const resultPages = limit && limit > 0 ? pages.slice(0, limit) : pages;

    logger.debug(`Обработано ${resultPages.length} страниц из CSV`);
    return resultPages;
  } catch (error) {
    if (error instanceof CSVError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new CSVError(`Ошибка чтения CSV файла: ${message}`, error);
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const limitPages = (
  pages: ParsedCSVRow[],
  limit?: number
): ParsedCSVRow[] => {
  if (!limit || limit <= 0) {
    return pages;
  }

  logger.info(`Ограничение количества страниц до ${limit}`);
  return pages.slice(0, limit);
};
