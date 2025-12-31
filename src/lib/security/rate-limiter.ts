import "server-only";

/**
 * Simple in-memory rate limiter for API protection
 *
 * Uses a sliding window algorithm to track requests per IP/user
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   *
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and remaining requests
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // 1. If no entry or entry expired, create new one
    if (!entry || now > entry.resetTime) {
      const resetTime = now + windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: limit - 1, resetTime };
    }

    // 2. Check if limit exceeded
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }

    // 3. Increment count
    entry.count++;
    this.store.set(identifier, entry);
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  /**
   * Cleanup on shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // API endpoints
  API: {
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // AI chat endpoints
  AI_CHAT: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Billing endpoints
  BILLING: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  public readonly statusCode = 429;
  public readonly code = "RATE_LIMIT_EXCEEDED";
  public readonly retryAfter: number;

  constructor(retryAfter: number) {
    super("Too many requests. Please try again later.");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
