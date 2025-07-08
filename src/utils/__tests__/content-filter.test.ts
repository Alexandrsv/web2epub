import { describe, it, expect } from "vitest";
import { ContentFilter, createFastFounderFilter } from "../content-filter.js";

describe("ContentFilter", () => {
  describe("текстовая фильтрация", () => {
    it("должен удалять простой текст", () => {
      const filter = new ContentFilter();
      filter.addTextRule("удалить это", "тестовое правило");

      const input = "Начало удалить это конец";
      const result = filter.filterContent(input);

      expect(result).toBe("Начало конец");
    });

    it("должен удалять множественные вхождения", () => {
      const filter = new ContentFilter();
      filter.addTextRule("spam", "удаление спама");

      const input = "spam текст spam еще spam";
      const result = filter.filterContent(input);

      expect(result).toBe("текст еще");
    });
  });

  describe("регулярные выражения", () => {
    it("должен удалять по regex паттерну", () => {
      const filter = new ContentFilter();
      filter.addRegexRule("\\d+", "удаление цифр");

      const input = "Текст 123 с цифрами 456";
      const result = filter.filterContent(input);

      expect(result).toBe("Текст с цифрами");
    });

    it("должен поддерживать флаги regex", () => {
      const filter = new ContentFilter();
      filter.addRegexRule("test", "удаление test", "gi");

      const input = "Test и test и TEST";
      const result = filter.filterContent(input);

      expect(result).toBe("и и");
    });
  });

  describe("множественные правила", () => {
    it("должен применять все правила последовательно", () => {
      const filter = new ContentFilter();
      filter.addTextRule("remove", "удаление remove");
      filter.addRegexRule("\\d+", "удаление цифр");

      const input = "text remove 123 end";
      const result = filter.filterContent(input);

      expect(result).toBe("text end");
    });
  });

  describe("очистка пробелов", () => {
    it("должен удалять лишние пробелы после фильтрации", () => {
      const filter = new ContentFilter();
      filter.addTextRule("удалить", "тест");

      const input = "начало   удалить   конец";
      const result = filter.filterContent(input);

      expect(result).toBe("начало конец");
    });
  });
});

describe("createFastFounderFilter", () => {
  it("должен создавать фильтр с предустановленными правилами", () => {
    const filter = createFastFounderFilter();

    expect(filter.getRulesCount()).toBeGreaterThan(0);
  });

  it("должен удалять блок про аудиоверсию", () => {
    const filter = createFastFounderFilter();

    const input = `<p>🎧 <a href="https://t.me/c/1715387706/39033">Аудиоверсия поста</a>. Чтобы послушать аудиоверсию, нужно сначала ввести свой Telegram ID в профиль и присоединиться к группе с обзорами в Телеграме <a href='https://fastfounder.ru/howtoread/'>вот по этой инструкции</a>.</p>
<h2>Основной контент</h2>`;

    const result = filter.filterContent(input);

    expect(result).not.toContain("🎧");
    expect(result).not.toContain("Аудиоверсия поста");
    expect(result).not.toContain("вот по этой инструкции");
    expect(result).toContain("Основной контент");
  });

  it("должен удалять вариации текста про аудиоверсию", () => {
    const filter = createFastFounderFilter();

    const input = "🎧 Послушать аудиоверсию можно по инструкции.";
    const result = filter.filterContent(input);

    expect(result).not.toContain("🎧");
    expect(result).not.toContain("аудиоверсию");
  });
});
