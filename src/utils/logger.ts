enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private readonly level: LogLevel;

  constructor(level: string = process.env.LOG_LEVEL || "info") {
    this.level = this.parseLogLevel(level);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private log(
    level: LogLevel,
    emoji: string,
    message: string,
    ...args: unknown[]
  ): void {
    if (level >= this.level) {
      console.log(`${emoji} ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, "🔍", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "ℹ️", message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "✅", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, "⚠️", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, "❌", message, ...args);
  }

  progress(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "🔄", message, ...args);
  }

  rocket(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "🚀", message, ...args);
  }

  book(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "📚", message, ...args);
  }

  party(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, "🎉", message, ...args);
  }

  boom(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, "💥", message, ...args);
  }
}

export const logger = new Logger();
