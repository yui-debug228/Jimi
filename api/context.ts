import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { logAuthDebug } from "./lib/audit";
import { verifyLocalToken } from "./routers/localAuthRouter";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // 1. Try local auth first (via x-local-auth-token header)
  try {
    const token = opts.req.headers.get("x-local-auth-token");
    if (token) {
      await logAuthDebug("context-check", "token-present=true");
      const parsed = await verifyLocalToken(token);
      if (!parsed) {
        await logAuthDebug("context-check", "invalid-jwt-token");
      } else {
        await logAuthDebug("context-parsed", `name=${parsed.name},role=${parsed.role}`);
        const db = getDb();
        let user = await db.query.users?.findFirst({
          where: eq(users.id, parsed.id),
        });
        if (!user) {
          // Fallback: find by unionId
          const rows = await db.select().from(users)
            .where(eq(users.unionId, `local:${parsed.name}`))
            .limit(1);
          if (rows.length > 0) user = rows[0];
        }
        if (user) {
          ctx.user = user;
          await logAuthDebug("context-local-auth-ok", `user=${user.name}(${user.role})`);
          return ctx;
        }
      }
    }
  } catch (err) {
    // Local auth failed, try OAuth
    await logAuthDebug("context-local-auth-error", err instanceof Error ? err.message : String(err));
  }

  // 2. Try OAuth
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional
  }

  return ctx;
}
