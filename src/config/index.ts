import dotenv from "dotenv";

// Загружаем переменные окружения из .env файла
dotenv.config();

export interface AppConfig {
  readonly DEV_PAGES_LIMIT: number;
  readonly COOKIES_FILE: string;
  readonly CSV_FILE: string;
  readonly OUTPUT_DIR: string;
  readonly isDev: boolean;
  readonly epub: {
    readonly parts: number;
  };
  readonly contentFilter: {
    readonly enabled: boolean;
  };
  readonly http: {
    readonly userAgent: string;
    readonly headers: Record<string, string>;
  };
  readonly delays: {
    readonly betweenRequests: number;
  };
  readonly retry: {
    readonly attempts: number;
    readonly delay: number;
  };
}

export const CONFIG: AppConfig = {
  DEV_PAGES_LIMIT: parseInt(process.env.PAGES_LIMIT || "3"),
  COOKIES_FILE: "./fastfounder.ru_cookies.txt",
  CSV_FILE: "./1.csv",
  OUTPUT_DIR: "./output",
  isDev:
    process.env.NODE_ENV === "development" || process.argv.includes("--dev"),

  epub: {
    parts: parseInt(process.env.EPUB_PARTS || "17"),
  },

  contentFilter: {
    enabled: process.env.CONTENT_FILTER !== "false", // По умолчанию включен, можно отключить через CONTENT_FILTER=false
  },

  http: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3",
      "Accept-Encoding": "gzip, deflate",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  },

  delays: {
    betweenRequests: parseInt(process.env.REQUEST_DELAY || "1000"),
  },

  retry: {
    attempts: 3,
    delay: 2000,
  },
};

// Backward compatibility
export const config = CONFIG;
export const HTTP_HEADERS = {
  "User-Agent": CONFIG.http.userAgent,
  ...CONFIG.http.headers,
} as const;
