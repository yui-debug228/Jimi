import type { Context, Next } from "hono";

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const key = c.req.header("x-forwarded-for") ||
      c.req.header("x-real-ip") ||
      "unknown";
    const now = Date.now();

    const record = store.get(key);
    if (record) {
      if (now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + options.windowMs });
      } else if (record.count >= options.maxRequests) {
        return c.json(
          { error: "Too many requests, please try again later" },
          429
        );
      } else {
        record.count++;
      }
    } else {
      store.set(key, { count: 1, resetTime: now + options.windowMs });
    }

    await next();
  };
}
