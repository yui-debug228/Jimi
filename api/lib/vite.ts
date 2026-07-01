import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import path from "path";

type App = Hono<{ Bindings: HttpBindings }>;

export function serveStaticFiles(app: App) {
  const distPath = path.resolve(import.meta.dirname, "../dist/public");

  // Only serve static files for non-API paths
  app.use("*", async (c, next) => {
    const reqPath = c.req.path;
    // Skip API routes - let them be handled by previously registered handlers
    if (reqPath.startsWith("/api/")) {
      return next();
    }
    // Fall through to static file serving
    return serveStatic({ root: "./dist/public" })(c, next);
  });

  app.notFound((c) => {
    const accept = c.req.header("accept") ?? "";
    if (!accept.includes("text/html")) {
      return c.json({ error: "Not Found" }, 404);
    }
    const indexPath = path.resolve(distPath, "index.html");
    const content = fs.readFileSync(indexPath, "utf-8");
    return c.html(content);
  });
}
