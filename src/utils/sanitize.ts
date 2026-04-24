// ─── Log sanitization helpers ────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set(["token", "apiToken", "authorization", "password", "secret"]);

export function sanitizeForLogging(value: string): string {
  if (!value || typeof value !== "string") return value;

  // Redact Bearer tokens
  if (value.includes("Bearer ")) {
    return value.replace(/Bearer\s+[^\s]+/g, "Bearer [REDACTED]");
  }

  // Redact base64-like tokens (40+ chars of alphanumeric/special chars)
  if (/^[A-Za-z0-9_-]{40,}$/.test(value)) {
    return "[REDACTED_TOKEN]";
  }

  // Redact email addresses
  if (value.includes("@")) {
    return value.replace(/[\w.-]+@[\w.-]+\.\w+/g, "[REDACTED_EMAIL]");
  }

  return value;
}

export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeForLogging(obj);
  }

  if (typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitizeObject(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}
