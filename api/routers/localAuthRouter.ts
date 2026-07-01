import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { logAuthDebug } from "../lib/audit";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "fallback-secret-change-in-production"
);
const JWT_ALG = "HS256";
const TOKEN_EXPIRY = "7d";

export async function signLocalToken(payload: { id: number; name: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyLocalToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALG],
      clockTolerance: 60,
    });
    return payload as { id: number; name: string; role: string };
  } catch {
    return null;
  }
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(z.object({
      username: z.string().min(2).max(30),
      password: z.string().min(6).max(100),
      inviteCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await logAuthDebug("register-start", `username=${input.username}`);

      // Check invite code
      const envCode = process.env.INVITE_CODE;
      if (envCode && input.inviteCode !== envCode) {
        await logAuthDebug("register-fail", "Invalid invite code");
        throw new Error("邀请码错误");
      }

      const db = getDb();

      // Check if username exists
      const existing = await db.select().from(users)
        .where(eq(users.unionId, `local:${input.username}`))
        .limit(1);

      if (existing.length > 0) {
        await logAuthDebug("register-fail", "Username already exists");
        throw new Error("用户名已存在");
      }

      // Hash password with bcrypt (cost factor 10)
      const passwordHash = await bcrypt.hash(input.password, 10);

      const result = await db.insert(users).values({
        unionId: `local:${input.username}`,
        name: input.username,
        passwordHash,
        role: "user",
      }).returning();

      const user = result[0];
      const token = await signLocalToken({
        id: user.id,
        name: input.username,
        role: "user",
      });

      await logAuthDebug("register-ok", `user=${input.username}`);
      return { success: true, token, user: { name: input.username, role: "user" } };
    }),

  login: publicQuery
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      await logAuthDebug("login-start", `username=${input.username}`);

      const db = getDb();
      const rows = await db.select().from(users)
        .where(eq(users.unionId, `local:${input.username}`))
        .limit(1);

      if (rows.length === 0) {
        await logAuthDebug("login-fail", "User not found");
        throw new Error("用户名或密码错误");
      }

      const user = rows[0];
      if (!user.passwordHash) {
        await logAuthDebug("login-fail", "No password hash (OAuth user)");
        throw new Error("用户名或密码错误");
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        await logAuthDebug("login-fail", "Password mismatch");
        throw new Error("用户名或密码错误");
      }

      // Update last sign in
      await db.update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));

      const token = await signLocalToken({
        id: user.id,
        name: user.name || input.username,
        role: user.role,
      });

      await logAuthDebug("login-ok", `user=${user.name}(${user.role})`);
      return { success: true, token, user: { name: user.name, role: user.role } };
    }),
});
