import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { likes } from "@db/schema";
import { eq, and, count, inArray } from "drizzle-orm";

export const likeRouter = createRouter({
  status: authedQuery
    .input(z.object({ imageId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const existing = await db.select().from(likes)
        .where(and(eq(likes.imageId, input.imageId), eq(likes.userId, userId)))
        .limit(1);
      return { liked: existing.length > 0 };
    }),

  toggle: authedQuery
    .input(z.object({ imageId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;
      const existing = await db.select().from(likes)
        .where(and(eq(likes.imageId, input.imageId), eq(likes.userId, userId)))
        .limit(1);

      if (existing.length > 0) {
        await db.delete(likes).where(eq(likes.id, existing[0].id));
        return { liked: false };
      } else {
        await db.insert(likes).values({ imageId: input.imageId, userId });
        return { liked: true };
      }
    }),

  counts: publicQuery
    .input(z.array(z.number()))
    .query(async ({ input }) => {
      const db = getDb();
      if (input.length === 0) return {};
      const result = await db
        .select({ imageId: likes.imageId, count: count() })
        .from(likes)
        .where(inArray(likes.imageId, input))
        .groupBy(likes.imageId);
      const map: Record<number, number> = {};
      for (const row of result) {
        map[row.imageId] = row.count;
      }
      return map;
    }),
});
