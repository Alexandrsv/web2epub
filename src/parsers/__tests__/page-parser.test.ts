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
    it("должен сохранять HTML структуру", () => {
      const parserAny = parser as unknown as Record<string, unknown>;
      const testHtml = "<p>Test <strong>bold</strong> &amp; content</p>";
      const cleaned = (parserAny.cleanHtmlContent as (html: string) => string)(
        testHtml
      );

      expect(cleaned).toBe("<p>Test <strong>bold</strong> &amp; content</p>");
      expect(cleaned).toContain("<p>");
      expect(cleaned).toContain("<strong>");
    });

    it("должен удалять скрипты и стили", () => {
      const parserAny = parser as unknown as Record<string, unknown>;
      const testHtml = "<div>Content <script>alert('test')</script> <style>body{color:red}</style> more</div>";
      const cleaned = (parserAny.cleanHtmlContent as (html: string) => string)(
        testHtml
      );

      expect(cleaned).toBe("<div>Content more</div>");
      expect(cleaned).not.toContain("script");
      expect(cleaned).not.toContain("style");
    });

    it("должен удалять избыточные пробелы", () => {
      const parserAny = parser as unknown as Record<string, unknown>;
      const testHtml = "<div>  Multiple    spaces   here  </div>";
      const cleaned = (parserAny.cleanHtmlContent as (html: string) => string)(
        testHtml
      );

      expect(cleaned).toBe("<div> Multiple spaces here </div>");
    });
  });

  describe("initializeParser (private method)", () => {
    it("должен инициализировать @postlight/parser", async () => {
      const parserAny = parser as unknown as Record<string, unknown>;
      await(parserAny.initializeParser as () => Promise<void>)();

      expect(parserAny.parser).toBeDefined();
      expect(typeof (parserAny.parser as Record<string, unknown>).parse).toBe(
        "function"
      );
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
