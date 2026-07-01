import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { presetImages } from "@db/schema";
import { logAction } from "../lib/audit";

export const presetImageRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(presetImages);
    const result: Record<string, { url: string; title: string | null; description: string | null }> = {};
    for (const row of rows) {
      result[row.slot] = { url: row.url, title: row.title, description: row.description };
    }
    return result;
  }),

  update: adminQuery
    .input(z.object({
      slot: z.string(),
      url: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(presetImages).values({
        slot: input.slot,
        url: input.url,
        title: input.title || null,
        description: input.description || null,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: presetImages.slot,
        set: {
          url: input.url,
          title: input.title || null,
          description: input.description || null,
          updatedAt: new Date(),
        },
      });
      await logAction(ctx.user.id.toString(), ctx.user.name ?? "admin", "update", "presetImage", input.slot, input.url.substring(0, 200));
      return { success: true };
    }),
});
