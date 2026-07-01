import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { Paths } from "@contracts/constants";
import { handleFileUpload } from "./lib/upload";
import { logAuthDebug } from "./lib/audit";
import { rateLimiter } from "./lib/rateLimiter";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// Apply rate limiting to sensitive endpoints
app.use("/api/upload", rateLimiter({ windowMs: 60 * 1000, maxRequests: 10 }));
app.use("/api/trpc/localAuth.login", rateLimiter({ windowMs: 60 * 1000, maxRequests: 5 }));
app.use("/api/trpc/localAuth.register", rateLimiter({ windowMs: 60 * 1000, maxRequests: 3 }));

// File upload endpoint (requires local auth token)
app.post("/api/upload", async (c) => {
  try {
    const token = c.req.header("x-local-auth-token");
    await logAuthDebug("upload", `token-present=${!!token}`);

    if (!token) {
      return c.json({ success: false, error: "Unauthorized - no token" }, 401);
    }

    // Verify JWT token
    const { verifyLocalToken } = await import("./routers/localAuthRouter");
    const parsed = await verifyLocalToken(token);
    if (!parsed) {
      return c.json({ success: false, error: "Unauthorized - invalid token" }, 401);
    }
    await logAuthDebug("upload-token", `name=${parsed.name},role=${parsed.role}`);

    if (parsed.role !== "admin") {
      return c.json({ success: false, error: "Forbidden - admin required" }, 403);
    }

    const result = await handleFileUpload(c);
    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logAuthDebug("upload-error", msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
