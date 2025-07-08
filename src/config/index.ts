export interface AppConfig {
  readonly DEV_PAGES_LIMIT: number;
  readonly COOKIES_FILE: string;
  readonly CSV_FILE: string;
  readonly OUTPUT_DIR: string;
  readonly isDev: boolean;
  readonly epub: {
    readonly parts: number;
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
    parts: parseInt(process.env.EPUB_PARTS || "50"),
  },

  http: {
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "ru,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
  },

  delays: {
    betweenRequests: parseInt(process.env.REQUEST_DELAY || "1000"),
  },

  retry: {
    attempts: parseInt(process.env.RETRY_ATTEMPTS || "3"),
    delay: 1000,
  },
};

// Backward compatibility
export const config = CONFIG;
export const HTTP_HEADERS = {
  "User-Agent": CONFIG.http.userAgent,
  ...CONFIG.http.headers,
} as const;
