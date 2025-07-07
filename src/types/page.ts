export interface PageData {
  readonly url: string;
  readonly title: string;
  readonly content: string;
  readonly excerpt?: string;
  readonly domain: string;
  readonly wordCount?: number;
  readonly datePublished?: string | null;
  readonly author?: string | null;
  readonly leadImageUrl?: string | null;
}

export interface ParseProgress {
  readonly total: number;
  readonly processed: number;
  readonly successful: number;
  readonly failed: number;
  readonly currentUrl?: string;
}

export interface ParseResult {
  readonly success: boolean;
  readonly data?: PageData;
  readonly error?: string;
  readonly retryCount?: number;
} 