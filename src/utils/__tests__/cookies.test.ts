import { describe, it, expect, beforeAll } from "vitest";
import { readCookies, validateCookies, CookiesError } from "../cookies.js";
import { existsSync } from "fs";

describe("Cookies Utils", () => {
  const cookiesFilePath = "./fastfounder.ru_cookies.txt";

  beforeAll(() => {
    // Проверяем что файл cookies существует
    if (!existsSync(cookiesFilePath)) {
      throw new Error(`Файл cookies не найден: ${cookiesFilePath}`);
    }
  });

  describe("readCookies", () => {
    it("должен читать cookies из файла", async () => {
      const cookies = await readCookies(cookiesFilePath);

      expect(cookies).toBeDefined();
      expect(typeof cookies).toBe("string");
      expect(cookies.length).toBeGreaterThan(0);
    });

    it("должен конвертировать Netscape format в HTTP Cookie header", async () => {
      const cookies = await readCookies(cookiesFilePath);

      // Проверяем формат HTTP Cookie (name=value; name2=value2)
      expect(cookies).toMatch(/^[^=]+=.+/);
      expect(cookies).not.toContain("# Netscape HTTP Cookie File");
    });

    it("должен выбросить ошибку для несуществующего файла", async () => {
      await expect(readCookies("./nonexistent.txt")).rejects.toThrow(
        CookiesError
      );
    });
  });

  describe("validateCookies", () => {
    it("должен валидировать корректные cookies", async () => {
      const cookies = await readCookies(cookiesFilePath);
      const isValid = validateCookies(cookies);

      expect(isValid).toBe(true);
    });

    it("должен отклонять некорректные cookies", () => {
      expect(validateCookies("")).toBe(false);
      expect(validateCookies("invalid-format")).toBe(false);
      expect(validateCookies("=value-without-name")).toBe(false);
    });

    it("должен принимать валидный формат", () => {
      expect(validateCookies("name=value")).toBe(true);
      expect(validateCookies("name1=value1; name2=value2")).toBe(true);
    });
  });
});
