import { describe, it, expect, beforeAll } from "vitest";
import { PageParser } from "../page-parser.js";
import { readCookies } from "../../utils/cookies.js";
import { CONFIG } from "../../config/index.js";

describe("PageParser", () => {
  let parser: PageParser;
  let cookies: string;

  beforeAll(async () => {
    // Инициализируем зависимости
    cookies = await readCookies("./fastfounder.ru_cookies.txt");
    parser = new PageParser(cookies);
  });

  describe("constructor", () => {
    it("должен создавать экземпляр парсера", () => {
      expect(parser).toBeDefined();
      expect(parser).toBeInstanceOf(PageParser);
    });
  });

  describe("cleanHtmlContent (private method)", () => {
    it("должен очищать HTML теги", () => {
      const parserAny = parser as any;
      const testHtml = "<p>Test <strong>bold</strong> &amp; content</p>";
      const cleaned = parserAny.cleanHtmlContent(testHtml);
      
      expect(cleaned).toBe("Test bold &amp; content");
      expect(cleaned).not.toContain("<");
      expect(cleaned).not.toContain(">");
    });

    it("должен удалять избыточные пробелы", () => {
      const parserAny = parser as any;
      const testHtml = "<div>  Multiple    spaces   here  </div>";
      const cleaned = parserAny.cleanHtmlContent(testHtml);
      
      expect(cleaned).toBe("Multiple spaces here");
    });
  });

  describe("initializeParser (private method)", () => {
    it("должен инициализировать @postlight/parser", async () => {
      const parserAny = parser as any;
      await parserAny.initializeParser();
      
      expect(parserAny.parser).toBeDefined();
      expect(typeof parserAny.parser.parse).toBe("function");
    });
  });

  describe("parsePages", () => {
    it("должен обрабатывать пустой массив URL", async () => {
      const results = await parser.parsePages([]);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it("должен возвращать пустой массив при ошибках сети", async () => {
      const invalidUrls = ["https://invalid-domain-that-does-not-exist.com/"];
      const results = await parser.parsePages(invalidUrls);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0); // Все запросы с ошибками игнорируются
    });
  });

  describe("CONFIG integration", () => {
    it("должен использовать правильные настройки retry", () => {
      expect(CONFIG.retry.attempts).toBeGreaterThan(0);
      expect(CONFIG.retry.delay).toBeGreaterThan(0);
    });

    it("должен использовать правильные настройки delays", () => {
      expect(CONFIG.delays.betweenRequests).toBeGreaterThan(0);
    });

    it("должен использовать правильные HTTP настройки", () => {
      expect(CONFIG.http.userAgent).toBeDefined();
      expect(CONFIG.http.userAgent.length).toBeGreaterThan(0);
    });
  });
});
