import { describe, it, expect, beforeAll } from "vitest";
import { readPagesFromCSV, CSVError } from "../csv.js";
import { existsSync } from "fs";

describe("CSV Utils", () => {
  const csvFilePath = "./1.csv";

  beforeAll(() => {
    // Проверяем что CSV файл существует
    if (!existsSync(csvFilePath)) {
      throw new Error(`CSV файл не найден: ${csvFilePath}`);
    }
  });

  describe("readPagesFromCSV", () => {
    it("должен читать страницы из CSV файла", async () => {
      const pages = await readPagesFromCSV(csvFilePath, 5);

      expect(pages).toBeDefined();
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.length).toBeLessThanOrEqual(5);
    });

    it("должен валидировать URL в CSV", async () => {
      const pages = await readPagesFromCSV(csvFilePath, 10);

      pages.forEach((page) => {
        expect(page.url).toBeDefined();
        expect(typeof page.url).toBe("string");
        expect(page.url).toMatch(/^https?:\/\//);
        expect(page.url).toContain("fastfounder.ru");
      });
    });

    it("должен читать все страницы без лимита", async () => {
      const pages = await readPagesFromCSV(csvFilePath);

      expect(pages.length).toBeGreaterThan(1000); // Ожидаем около 1787 страниц
    });

    it("должен соблюдать лимит страниц", async () => {
      const limit = 3;
      const pages = await readPagesFromCSV(csvFilePath, limit);

      expect(pages.length).toBe(limit);
    });

    it("должен выбросить ошибку для несуществующего файла", async () => {
      await expect(readPagesFromCSV("./nonexistent.csv")).rejects.toThrow(
        CSVError
      );
    });

    it("должен иметь правильную структуру данных", async () => {
      const pages = await readPagesFromCSV(csvFilePath, 1);
      const page = pages[0];

      expect(page).toHaveProperty("url");
      expect(page).toHaveProperty("timestamp");
      expect(typeof page.url).toBe("string");
      expect(typeof page.timestamp).toBe("string");
    });
  });
});
