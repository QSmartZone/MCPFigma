// ─── Sliding-window rate limiter ──────────────────────────────────────────────

interface WindowEntry {
  timestamps: number[];
}

export class RateLimiter {
  private windows = new Map<string, WindowEntry>();

  constructor(private requestsPerMinute: number) {}

  checkLimit(toolName: string): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    let entry = this.windows.get(toolName);
    if (!entry) {
      entry = { timestamps: [] };
      this.windows.set(toolName, entry);
    }

    // Remove timestamps older than 1 minute
    entry.timestamps = entry.timestamps.filter((ts) => ts > oneMinuteAgo);

    // Check if limit exceeded
    if (entry.timestamps.length >= this.requestsPerMinute) {
      const oldestTimestamp = entry.timestamps[0];
      const resetInMs = oneMinuteAgo + 60000 - now;
      throw new Error(
        `Rate limit exceeded for tool "${toolName}". ` +
        `Limit: ${this.requestsPerMinute} requests/minute. ` +
        `Reset in ${Math.ceil(resetInMs / 1000)}s.`
      );
    }

    // Record this request
    entry.timestamps.push(now);
  }

  getUsage(toolName: string): { count: number; limit: number; resetInMs: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const entry = this.windows.get(toolName);
    if (!entry) {
      return { count: 0, limit: this.requestsPerMinute, resetInMs: 60000 };
    }

    const recentTimestamps = entry.timestamps.filter((ts) => ts > oneMinuteAgo);
    const oldestTimestamp = recentTimestamps[0];
    const resetInMs = oldestTimestamp ? oldestTimestamp + 60000 - now : 60000;

    return {
      count: recentTimestamps.length,
      limit: this.requestsPerMinute,
      resetInMs: Math.max(0, resetInMs),
    };
  }

  reset(toolName?: string): void {
    if (toolName) {
      this.windows.delete(toolName);
    } else {
      this.windows.clear();
    }
  }
}

// ─── Singleton rate limiter ───────────────────────────────────────────────────

let globalLimiter: RateLimiter | null = null;

export function initializeRateLimiter(rpm: number): RateLimiter {
  globalLimiter = new RateLimiter(rpm);
  return globalLimiter;
}

export function getRateLimiter(): RateLimiter {
  if (!globalLimiter) {
    throw new Error("RateLimiter not initialized. Call initializeRateLimiter() first.");
  }
  return globalLimiter;
}
