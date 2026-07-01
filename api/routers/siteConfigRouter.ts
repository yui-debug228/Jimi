import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { siteConfig } from "@db/schema";
import { logAction } from "../lib/audit";

export const siteConfigRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(siteConfig);
    const config: Record<string, string> = {};
    for (const row of rows) config[row.key] = row.value;
    return {
      heroImage: config.heroImage || "/images/mimi-hero.jpg",
      heroTitle: config.heroTitle || "欢迎光临\n米米的小世界",
      heroSubtitle: config.heroSubtitle || "灰色法国蓝猫 · 2岁 · 性格文静",
      aboutText: config.aboutText || "米米是一只出生于杭州的灰色英短。她拥有安静的性格，喜欢趴在窗台上观察外面的世界，或者在温暖的午后蜷缩成一团。这是一个专门为她建立的网络小窝，记录她生活中的每一个慵懒瞬间。",
      aboutPortrait: config.aboutPortrait || "/images/mimi-portrait.jpg",
      catName: config.catName || "米米",
      catBreed: config.catBreed || "法国蓝猫 / 英短",
      catAge: config.catAge || "2岁",
      catPersonality: config.catPersonality || "文静、慵懒、好奇",
    };
  }),

  set: adminQuery
    .input(z.object({ key: z.string().min(1), value: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(siteConfig).values({ key: input.key, value: input.value, updatedAt: new Date() }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: input.value, updatedAt: new Date() },
      });
      await logAction(ctx.user.id.toString(), ctx.user.name ?? "admin", "update", "siteConfig", input.key, input.value.substring(0, 200));
      return { success: true };
    }),

  batchSet: adminQuery
    .input(z.array(z.object({ key: z.string(), value: z.string() })))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      for (const item of input) {
        await db.insert(siteConfig).values({ key: item.key, value: item.value, updatedAt: new Date() }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value: item.value, updatedAt: new Date() },
        });
      }
      await logAction(ctx.user.id.toString(), ctx.user.name ?? "admin", "batchUpdate", "siteConfig", undefined, `Updated ${input.length} keys`);
      return { success: true };
    }),
});
