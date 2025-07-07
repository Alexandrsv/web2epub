import type { PageData } from "./page.js";

export interface EpubMetadata {
  readonly title: string;
  readonly author: string;
  readonly description?: string;
  readonly language: string;
  readonly published?: string;
  readonly publisher?: string;
  readonly cover?: string;
}

export interface EpubChapter {
  readonly title: string;
  readonly content: string;
  readonly url?: string;
  readonly date?: string;
}

export interface EpubOptions {
  readonly metadata: EpubMetadata;
  readonly chapters: EpubChapter[];
  readonly outputPath: string;
  readonly css?: string;
}

export interface EpubGenerationResult {
  readonly success: boolean;
  readonly outputPath?: string;
  readonly error?: string;
  readonly fileSize?: number;
  readonly chaptersCount?: number;
}

export interface EpubPartResult {
  readonly partNumber: number;
  readonly outputPath: string;
  readonly fileSize: number;
  readonly chaptersCount: number;
  readonly title: string;
}

export interface MultiPartEpubGenerationResult {
  readonly success: boolean;
  readonly error?: string;
  readonly totalParts: number;
  readonly totalChapters: number;
  readonly totalFileSize: number;
  readonly parts: EpubPartResult[];
}

export const defaultEpubMetadata: EpubMetadata = {
  title: "Fast Founder - Полная коллекция статей",
  author: "Fast Founder",
  description: "Полная коллекция статей с сайта fastfounder.ru",
  language: "ru",
  publisher: "fastfounder.ru",
};

export const pageDataToChapter = (page: PageData): EpubChapter => ({
  title: page.title,
  content: page.content,
  url: page.url,
  date: page.datePublished || undefined,
});
