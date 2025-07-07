import { promises as fs } from "fs";
import path from "path";
import { PageData } from "../types/page.js";
import { logger } from "./logger.js";

interface CacheData {
  version: string;
  timestamp: number;
  pages: Record<string, PageData>; // url -> PageData
}

export class PageCache {
  private readonly cacheFile: string;
  private readonly cacheVersion = "1.0.0";
  private cache: CacheData | null = null;

  constructor(cacheDir: string = "./cache") {
    this.cacheFile = path.join(cacheDir, "parsed-pages.json");
  }

  async ensureCacheDir(): Promise<void> {
    const cacheDir = path.dirname(this.cacheFile);
    await fs.mkdir(cacheDir, { recursive: true });
  }

  async loadCache(): Promise<void> {
    try {
      await this.ensureCacheDir();
      const data = await fs.readFile(this.cacheFile, "utf-8");
      const parsed = JSON.parse(data) as CacheData;

      if (parsed.version === this.cacheVersion) {
        this.cache = parsed;
        logger.debug(
          `Кеш загружен: ${Object.keys(parsed.pages).length} страниц`
        );
      } else {
        logger.debug("Версия кеша устарела, создаем новый");
        this.cache = this.createEmptyCache();
      }
    } catch {
      logger.debug("Кеш не найден или поврежден, создаем новый");
      this.cache = this.createEmptyCache();
    }
  }

  private createEmptyCache(): CacheData {
    return {
      version: this.cacheVersion,
      timestamp: Date.now(),
      pages: {},
    };
  }

  async saveCache(): Promise<void> {
    if (!this.cache) return;

    this.cache.timestamp = Date.now();
    await this.ensureCacheDir();
    await fs.writeFile(this.cacheFile, JSON.stringify(this.cache, null, 2));
    logger.debug(
      `Кеш сохранен: ${Object.keys(this.cache.pages).length} страниц`
    );
  }

  async getPage(url: string): Promise<PageData | null> {
    if (!this.cache) await this.loadCache();
    return this.cache?.pages[url] || null;
  }

  async setPage(url: string, pageData: PageData): Promise<void> {
    if (!this.cache) await this.loadCache();
    if (this.cache) {
      this.cache.pages[url] = pageData;
    }
  }

  async hasPage(url: string): Promise<boolean> {
    if (!this.cache) await this.loadCache();
    return !!this.cache?.pages[url];
  }

  async getCacheStats(): Promise<{ totalPages: number; cacheAge: number }> {
    if (!this.cache) await this.loadCache();
    return {
      totalPages: Object.keys(this.cache?.pages || {}).length,
      cacheAge: Date.now() - (this.cache?.timestamp || 0),
    };
  }

  async clearCache(): Promise<void> {
    this.cache = this.createEmptyCache();
    try {
      await fs.unlink(this.cacheFile);
      logger.info("Кеш очищен");
    } catch {
      // Файл кеша не существует
    }
  }

  async getUncachedUrls(urls: string[]): Promise<string[]> {
    if (!this.cache) await this.loadCache();

    const uncached: string[] = [];
    for (const url of urls) {
      if (!this.cache?.pages[url]) {
        uncached.push(url);
      }
    }
    return uncached;
  }

  async getCachedPages(urls: string[]): Promise<PageData[]> {
    if (!this.cache) await this.loadCache();

    const cached: PageData[] = [];
    for (const url of urls) {
      const page = this.cache?.pages[url];
      if (page) {
        cached.push(page);
      }
    }
    return cached;
  }
}
