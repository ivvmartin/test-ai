import "server-only";

/**
 * Sanitize user input to prevent XSS and injection attacks
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 * while preserving legitimate content
 *
 * This function:
 * - Removes null bytes
 * - Removes control characters (except newlines and tabs)
 * - Trims excessive whitespace
 * - Limits length to prevent DoS
 *
 * Note: This does NOT sanitize HTML. The app uses ReactMarkdown which
 * handles HTML escaping automatically
 */
export function sanitizeText(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  sanitized = sanitized.replace(/\0/g, "");

  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  sanitized = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

  sanitized = sanitized.trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate that a string doesn't contain suspicious patterns
 * that might indicate an attack attempt
 *
 * Returns true if the input appears safe, false otherwise
 */
export function validateTextSafety(input: string): {
  isSafe: boolean;
  reason?: string;
} {
  if (!input || typeof input !== "string") {
    return { isSafe: true };
  }

  if (input.includes("\0")) {
    return { isSafe: false, reason: "Contains null bytes" };
  }

  if (input.length > 50000) {
    return { isSafe: false, reason: "Input too long" };
  }

  const suspiciousUnicode = /[\u200B-\u200D\u202A-\u202E\uFEFF]/;
  if (suspiciousUnicode.test(input)) {
    return { isSafe: false, reason: "Contains suspicious Unicode characters" };
  }

  return { isSafe: true };
}

/**
 * Sanitize and validate user input in one step
 *
 * This is the main function to use for user-submitted text
 */
export function sanitizeUserInput(
  input: string,
  maxLength: number = 10000
): {
  sanitized: string;
  isValid: boolean;
  reason?: string;
} {
  const validation = validateTextSafety(input);
  if (!validation.isSafe) {
    return {
      sanitized: "",
      isValid: false,
      reason: validation.reason,
    };
  }

  const sanitized = sanitizeText(input, maxLength);

  return {
    sanitized,
    isValid: true,
  };
}
