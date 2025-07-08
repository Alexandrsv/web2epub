import { logger } from "./logger.js";

export interface ContentFilterRule {
  readonly type: "regex" | "text";
  readonly pattern: string;
  readonly description: string;
  readonly flags?: string; // Для regex: i, g, m и т.д.
}

export class ContentFilter {
  private readonly rules: ContentFilterRule[] = [];

  constructor(rules: ContentFilterRule[] = []) {
    this.rules = [...rules];
  }

  /**
   * Добавляет правило фильтрации
   */
  addRule(rule: ContentFilterRule): void {
    this.rules.push(rule);
    logger.debug(`Добавлено правило фильтрации: ${rule.description}`);
  }

  /**
   * Добавляет правило для удаления текста
   */
  addTextRule(text: string, description: string): void {
    this.addRule({
      type: "text",
      pattern: text,
      description,
    });
  }

  /**
   * Добавляет правило для удаления по регулярному выражению
   */
  addRegexRule(pattern: string, description: string, flags = "gi"): void {
    this.addRule({
      type: "regex",
      pattern,
      description,
      flags,
    });
  }

  /**
   * Применяет все правила фильтрации к тексту
   */
  filterContent(content: string): string {
    let filteredContent = content;
    let totalReplacements = 0;

    for (const rule of this.rules) {
      const beforeLength = filteredContent.length;

      if (rule.type === "text") {
        // Простое удаление текста
        filteredContent = filteredContent.split(rule.pattern).join("");
      } else if (rule.type === "regex") {
        // Удаление по регулярному выражению
        const regex = new RegExp(rule.pattern, rule.flags || "gi");
        filteredContent = filteredContent.replace(regex, "");
      }

      const afterLength = filteredContent.length;
      const replacements = beforeLength - afterLength;

      if (replacements > 0) {
        totalReplacements += replacements;
        logger.debug(
          `Правило "${rule.description}": удалено ${replacements} символов`
        );
      }
    }

    if (totalReplacements > 0) {
      // Очищаем лишние пробелы и переносы строк после фильтрации
      filteredContent = filteredContent
        .replace(/\s{2,}/g, " ") // Убираем 2+ пробелов подряд (заменяем одним)
        .replace(/\n\s*\n\s*\n/g, "\n\n") // Убираем лишние переносы строк
        .trim();

      logger.debug(`Общее количество удаленных символов: ${totalReplacements}`);
    }

    return filteredContent;
  }

  /**
   * Возвращает количество активных правил
   */
  getRulesCount(): number {
    return this.rules.length;
  }

  /**
   * Возвращает список всех правил
   */
  getRules(): readonly ContentFilterRule[] {
    return [...this.rules];
  }
}

// Предустановленные правила для FastFounder
export const createFastFounderFilter = (): ContentFilter => {
  const filter = new ContentFilter();

  // Правило для удаления блока про аудиоверсию
  filter.addRegexRule(
    "🎧\\s*<a[^>]*>Аудиоверсия поста</a>\\.[^<]*<a[^>]*>вот по этой инструкции</a>\\.</p>",
    "Удаление блока про аудиоверсию поста"
  );

  // Альтернативное правило на случай вариаций
  filter.addRegexRule(
    "🎧[^.]*аудиоверсию[^.]*инструкции[^.]*\\.",
    "Удаление вариаций текста про аудиоверсию"
  );

  return filter;
};
