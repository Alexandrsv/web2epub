import { describe, it, expect } from "vitest";
import { EpubGenerator } from "../generator.js";
import { PageData } from "../../types/page.js";
import { defaultEpubMetadata } from "../../types/index.js";

describe("EpubGenerator", () => {
  const generator = new EpubGenerator();

  const mockPages: PageData[] = [
    {
      title: "Статья 1",
      content: "<p>Содержимое статьи 1</p>",
      excerpt: "Краткое описание",
      url: "https://example.com/article1",
      domain: "example.com",
      wordCount: 50,
      datePublished: "2023-01-01",
      author: "Автор 1",
      leadImageUrl: null,
    },
    {
      title: "Статья 2", 
      content: "<p>Содержимое статьи 2</p>",
      excerpt: "Краткое описание",
      url: "https://example.com/article2",
      domain: "example.com",
      wordCount: 60,
      datePublished: "2023-01-02",
      author: "Автор 2",
      leadImageUrl: null,
    },
    {
      title: "Статья 3",
      content: "<p>Содержимое статьи 3</p>",
      excerpt: "Краткое описание",
      url: "https://example.com/article3",
      domain: "example.com",
      wordCount: 40,
      datePublished: "2023-01-03",
      author: "Автор 3",
      leadImageUrl: null,
    },
  ];

  describe("generateMultiPartEpub", () => {
    it("должен создавать одну часть при parts=1", async () => {
      const result = await generator.generateMultiPartEpub(
        mockPages,
        defaultEpubMetadata,
        "./test-single.epub",
        1
      );

      expect(result.success).toBe(true);
      expect(result.totalParts).toBe(1);
      expect(result.totalChapters).toBe(3);
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].partNumber).toBe(1);
      expect(result.parts[0].chaptersCount).toBe(3);
    }, 10000);

    it("должен правильно разбивать на несколько частей", async () => {
      const result = await generator.generateMultiPartEpub(
        mockPages,
        defaultEpubMetadata,
        "./test-multi.epub",
        2
      );

      expect(result.success).toBe(true);
      expect(result.totalParts).toBe(2);
      expect(result.totalChapters).toBe(3);
      expect(result.parts).toHaveLength(2);
      
      // Проверяем распределение глав
      const totalChaptersInParts = result.parts.reduce(
        (sum, part) => sum + part.chaptersCount,
        0
      );
      expect(totalChaptersInParts).toBe(3);

      // Проверяем нумерацию частей
      expect(result.parts[0].partNumber).toBe(1);
      expect(result.parts[1].partNumber).toBe(2);

      // Проверяем названия частей
      expect(result.parts[0].title).toContain("Часть 1");
      expect(result.parts[1].title).toContain("Часть 2");
    }, 10000);

    it("должен создавать столько частей сколько есть глав если частей больше", async () => {
      const result = await generator.generateMultiPartEpub(
        mockPages,
        defaultEpubMetadata,
        "./test-many-parts.epub",
        10 // Больше чем страниц
      );

      expect(result.success).toBe(true);
      expect(result.totalParts).toBe(3); // Должно быть столько же сколько страниц
      expect(result.totalChapters).toBe(3);
      expect(result.parts).toHaveLength(3);
      
      // Каждая часть должна содержать 1 главу
      result.parts.forEach((part) => {
        expect(part.chaptersCount).toBe(1);
      });
    }, 10000);

    it("должен обрабатывать пустой массив страниц", async () => {
      const result = await generator.generateMultiPartEpub(
        [],
        defaultEpubMetadata,
        "./test-empty.epub",
        3
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Нет страниц для включения в EPUB");
      expect(result.totalParts).toBe(0);
      expect(result.parts).toHaveLength(0);
    });
  });

  describe("splitChaptersIntoParts (через тестирование generateMultiPartEpub)", () => {
    it("должен равномерно распределять главы", async () => {
      // Создаем 6 страниц для тестирования разбивки на 3 части
      const sixPages = Array.from({ length: 6 }, (_, i) => ({
        ...mockPages[0],
        title: `Статья ${i + 1}`,
        url: `https://example.com/article${i + 1}`,
      }));

      const result = await generator.generateMultiPartEpub(
        sixPages,
        defaultEpubMetadata,
        "./test-even-split.epub",
        3
      );

      expect(result.success).toBe(true);
      expect(result.totalParts).toBe(3);
      expect(result.totalChapters).toBe(6);
      
      // Каждая часть должна содержать 2 главы (6/3 = 2)
      result.parts.forEach((part) => {
        expect(part.chaptersCount).toBe(2);
      });
    }, 15000);
  });
}); 