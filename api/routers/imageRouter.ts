import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { images } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { logAction } from "../lib/audit";

export const imageRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(images).orderBy(desc(images.createdAt));
  }),

  create: adminQuery
    .input(
      z.object({
        url: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(images).values({
        url: input.url,
        title: input.title || null,
        description: input.description || null,
        category: input.category || null,
      }).returning();
      await logAction(
        ctx.user.id.toString(),
        ctx.user.name ?? "admin",
        "create",
        "image",
        String(result[0].id),
        input.title || input.url.substring(0, 100)
      );
      return { id: result[0].id };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(images).where(eq(images.id, input.id));
      await logAction(
        ctx.user.id.toString(),
        ctx.user.name ?? "admin",
        "delete",
        "image",
        String(input.id),
        undefined
      );
      return { success: true };
    }),
});
