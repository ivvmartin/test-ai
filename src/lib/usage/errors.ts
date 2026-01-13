/**
 * Limit Exceeded Error
 *
 * Thrown when a user attempts to consume usage beyond their monthly limit.
 * Should be handled with HTTP 429 (Too Many Requests) status code.
 */
export class LimitExceededError extends Error {
  public readonly statusCode = 429;
  public readonly code = "LIMIT_EXCEEDED";

  constructor(
    message: string = "Usage limit has been reached. Please upgrade your plan.",
    public readonly used: number = 0,
    public readonly limit: number = 0,
    public readonly planKey: string = "TRIAL"
  ) {
    super(message);
    this.name = "LimitExceededError";

    // Maintain proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LimitExceededError);
    }
  }

  /**
   * Create a formatted error message with usage details
   * For TRIAL plan: no renewal, must upgrade
   * For other plans: can wait for next billing period
   */
  static createMessage(used: number, limit: number, planKey?: string): string {
    const baseMessage = `Usage limit of ${limit} messages has been reached (used: ${used}).`;

    if (planKey === "TRIAL") {
      return `${baseMessage} Please upgrade your plan to continue.`;
    }

    return `${baseMessage} Upgrade your plan or wait for the next billing period.`;
  }
}

/**
 * Usage Error
 *
 * General error for usage system failures.
 * Should be handled with HTTP 500 (Internal Server Error) status code.
 */
export class UsageError extends Error {
  public readonly statusCode = 500;
  public readonly code = "USAGE_ERROR";

  constructor(message: string = "An error occurred in the usage system") {
    super(message);
    this.name = "UsageError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UsageError);
    }
  }
}

/**
 * Type guard for usage errors
 */
export function isUsageError(
  error: unknown
): error is LimitExceededError | UsageError {
  return error instanceof LimitExceededError || error instanceof UsageError;
}
