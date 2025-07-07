import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { PageCache } from "../cache.js";
import { PageData } from "../../types/page.js";

describe("PageCache", () => {
  const testCacheDir = "./test-cache";
  let cache: PageCache;

  const mockPageData: PageData = {
    title: "Test Article",
    content: "<p>Test content</p>",
    excerpt: "Test excerpt",
    url: "https://example.com/test",
    domain: "example.com",
    wordCount: 100,
    datePublished: "2023-01-01",
    author: "Test Author",
    leadImageUrl: null
  };

  beforeEach(() => {
    cache = new PageCache(testCacheDir);
  });

  afterEach(async () => {
    // Очищаем тестовый кеш
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch {
      // Игнорируем ошибки удаления
    }
  });

  it("должен создавать пустой кеш", async () => {
    const stats = await cache.getCacheStats();
    expect(stats.totalPages).toBe(0);
  });

  it("должен сохранять и загружать страницу", async () => {
    await cache.setPage(mockPageData.url, mockPageData);
    
    const retrieved = await cache.getPage(mockPageData.url);
    expect(retrieved).toEqual(mockPageData);
  });

  it("должен проверять наличие страницы", async () => {
    expect(await cache.hasPage(mockPageData.url)).toBe(false);
    
    await cache.setPage(mockPageData.url, mockPageData);
    expect(await cache.hasPage(mockPageData.url)).toBe(true);
  });

  it("должен возвращать некешированные URL", async () => {
    const urls = [
      "https://example.com/test1",
      "https://example.com/test2",
      "https://example.com/test3"
    ];

    // Кешируем только одну страницу
    await cache.setPage(urls[1], mockPageData);

    const uncached = await cache.getUncachedUrls(urls);
    expect(uncached).toEqual([urls[0], urls[2]]);
  });

  it("должен возвращать кешированные страницы", async () => {
    const urls = [
      "https://example.com/test1",
      "https://example.com/test2"
    ];

    // Кешируем только одну страницу
    await cache.setPage(urls[0], mockPageData);

    const cached = await cache.getCachedPages(urls);
    expect(cached).toHaveLength(1);
    expect(cached[0]).toEqual(mockPageData);
  });

  it("должен сохранять кеш в файл", async () => {
    await cache.setPage(mockPageData.url, mockPageData);
    await cache.saveCache();

    // Создаем новый экземпляр кеша и проверяем загрузку
    const newCache = new PageCache(testCacheDir);
    const retrieved = await newCache.getPage(mockPageData.url);
    expect(retrieved).toEqual(mockPageData);
  });

  it("должен очищать кеш", async () => {
    await cache.setPage(mockPageData.url, mockPageData);
    expect(await cache.hasPage(mockPageData.url)).toBe(true);

    await cache.clearCache();
    expect(await cache.hasPage(mockPageData.url)).toBe(false);
  });
}); 