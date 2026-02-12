type recoveryStrategy = "fatal" | "skip" | "retry";
type errorContext =
  | "setup"
  | "scraping"
  | "writing-author"
  | "writing-play"
  | "processing-play"
  | "processing-author";

type ScrapingErrorProps = {
  message: string;
  name: string;
  cause?: unknown;
  recoveryStrategy: recoveryStrategy;
  context: errorContext;
};

abstract class BaseScrapingError extends Error {
  public name: string;
  public cause?: unknown;
  public recoveryStrategy: recoveryStrategy;
  public context: errorContext;

  constructor({
    message,
    name = "ScrapingError",
    cause,
    recoveryStrategy,
    context,
  }: ScrapingErrorProps) {
    super(message, { cause });
    this.name = name || "ScrapingError";
    this.cause = cause;
    this.recoveryStrategy = recoveryStrategy;
    this.context = context;
  }
}

class SetupError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "SetupError",
      recoveryStrategy: "fatal",
      context: "setup",
      message,
      cause,
    });
  }
}

class ScrapingError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "ScrapingError",
      recoveryStrategy: "skip",
      context: "scraping",
      message,
      cause,
    });
  }
}

class PlayProcessingError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "PlayProcessingError",
      recoveryStrategy: "skip",
      context: "processing-play",
      message,
      cause,
    });
  }
}

class AuthorProcessingError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "AuthorProcessingError",
      recoveryStrategy: "skip",
      context: "processing-author",
      message,
      cause,
    });
  }
}

class WriteAuthorError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "WriteAuthorError",
      recoveryStrategy: "skip",
      context: "writing-author",
      message,
      cause,
    });
  }
}

class WritePlayError extends BaseScrapingError {
  constructor(message: string, cause?: unknown) {
    super({
      name: "WritePlayError",
      recoveryStrategy: "skip",
      context: "writing-play",
      message,
      cause,
    });
  }
}

export {
  ScrapingError,
  SetupError,
  WriteAuthorError,
  WritePlayError,
  PlayProcessingError,
  AuthorProcessingError,
};

export type { recoveryStrategy, errorContext, ScrapingErrorProps };
