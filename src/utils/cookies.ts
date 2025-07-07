import * as fs from "fs";
import { logger } from "./logger.js";

export class CookiesError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CookiesError";
  }
}

interface NetscapeCookie {
  domain: string;
  domainSpecified: boolean;
  path: string;
  secure: boolean;
  expires: number;
  name: string;
  value: string;
}

const parseNetscapeCookies = (content: string): NetscapeCookie[] => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return lines.map((line, index) => {
    const parts = line.split("\t");

    if (parts.length !== 7) {
      throw new CookiesError(
        `Неверный формат cookie в строке ${index + 1}: ожидается 7 полей, получено ${parts.length}`
      );
    }

    const [domain, domainSpecified, path, secure, expires, name, value] = parts;

    return {
      domain,
      domainSpecified: domainSpecified === "TRUE",
      path,
      secure: secure === "TRUE",
      expires: parseInt(expires),
      name,
      value,
    };
  });
};

const netscapeCookiesToHttpHeader = (cookies: NetscapeCookie[]): string => {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
};

export const readCookies = async (filePath: string): Promise<string> => {
  try {
    logger.debug(`Чтение cookies из файла: ${filePath}`);

    const cookiesContent = await fs.promises.readFile(filePath, "utf-8");

    if (!cookiesContent.trim()) {
      throw new CookiesError("Файл cookies пуст");
    }

    // Проверяем формат файла
    if (cookiesContent.includes("# Netscape HTTP Cookie File")) {
      logger.debug("Обнаружен формат Netscape cookie file");
      const netscapeCookies = parseNetscapeCookies(cookiesContent);
      const httpCookies = netscapeCookiesToHttpHeader(netscapeCookies);

      logger.debug(`Конвертировано ${netscapeCookies.length} cookies`);
      logger.debug(`HTTP Cookie header (${httpCookies.length} символов)`);

      return httpCookies;
    } else {
      // Предполагаем, что это уже готовая строка HTTP Cookie
      const cookies = cookiesContent.trim();
      logger.debug(`Используем cookies как есть (${cookies.length} символов)`);
      return cookies;
    }
  } catch (error) {
    if (error instanceof CookiesError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new CookiesError(
      `Не удалось прочитать файл cookies: ${message}`,
      error
    );
  }
};

export const validateCookies = (cookies: string): boolean => {
  // Базовая валидация формата HTTP cookies
  const cookiePattern = /^[^=]+=.+/;
  return cookies.split(";").some((cookie) => cookiePattern.test(cookie.trim()));
};
