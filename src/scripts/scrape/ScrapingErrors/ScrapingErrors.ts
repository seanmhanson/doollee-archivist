type recoveryStrategy = "fatal" | "skip" | "retry";
type errorContext = "setup" | "scraping" | "writing-author" | "writing-play" | "processing-play" | "processing-author";

type ScrapingErrorProps = {
  message: string;
  name: string;
  cause?: unknown;
  recoveryStrategy: recoveryStrategy;
  context: errorContext;
};

type ErrorCauseSnapshot = {
  name: string;
  message: string;
  stack?: string;
};

type SerializedScrapingError = {
  name: string;
  message: string;
  stack?: string;
  context?: errorContext;
  recoveryStrategy?: recoveryStrategy;
  causeChain: ErrorCauseSnapshot[];
};

type ScrapingErrorLogContext = {
  profileName?: string;
  profileSlug?: string;
  authorUrl?: string;
  playId?: string;
  playTitle?: string;
  writeTo?: string;
  reviewFilePath?: string;
  reviewFileWriteError?: string;
};

abstract class BaseScrapingError extends Error {
  public name: string;
  public cause?: unknown;
  public recoveryStrategy: recoveryStrategy;
  public context: errorContext;

  constructor({ message, name = "ScrapingError", cause, recoveryStrategy, context }: ScrapingErrorProps) {
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

const MAX_CAUSE_DEPTH = 5;

function getCauseFromUnknown(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  return Reflect.has(error, "cause") ? Reflect.get(error, "cause") : undefined;
}

function normalizeErrorLike(error: unknown): ErrorCauseSnapshot {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message || "Unknown error",
      stack: error.stack,
    };
  }

  const isObjectLike = typeof error === "object" && error !== null;
  const name = isObjectLike && Reflect.has(error, "name") ? String(Reflect.get(error, "name")) : "UnknownError";
  const message = isObjectLike && Reflect.has(error, "message") ? String(Reflect.get(error, "message")) : String(error);
  return { name, message };
}

function serializeError(error: unknown): SerializedScrapingError {
  const root = normalizeErrorLike(error);
  const output: SerializedScrapingError = {
    ...root,
    causeChain: [],
  };

  if (error instanceof BaseScrapingError) {
    output.context = error.context;
    output.recoveryStrategy = error.recoveryStrategy;
  }

  const seen = new Set<unknown>();
  let current = getCauseFromUnknown(error);
  let depth = 0;

  while (current && depth < MAX_CAUSE_DEPTH && !seen.has(current)) {
    seen.add(current);
    output.causeChain.push(normalizeErrorLike(current));
    current = getCauseFromUnknown(current);
    depth++;
  }

  return output;
}

function createErrorLogPayload(error: unknown, context: ScrapingErrorLogContext = {}) {
  return {
    error: serializeError(error),
    context,
    timestamp: new Date().toISOString(),
  };
}

export { ScrapingError, SetupError, WriteAuthorError, WritePlayError, PlayProcessingError, AuthorProcessingError };
export { serializeError, createErrorLogPayload };

export type {
  recoveryStrategy,
  errorContext,
  ScrapingErrorProps,
  ErrorCauseSnapshot,
  SerializedScrapingError,
  ScrapingErrorLogContext,
};
