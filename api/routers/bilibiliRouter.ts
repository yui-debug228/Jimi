import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { bilibiliVideos } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { logAction } from "../lib/audit";

function extractBvid(url: string): string | null {
  const bvMatch = url.match(/BV[\w]+/);
  if (bvMatch) return bvMatch[0];
  const bvidMatch = url.match(/bvid=([\w]+)/i);
  if (bvidMatch) return bvidMatch[1];
  return null;
}

async function fetchBilibiliInfo(bvid: string): Promise<{ title?: string; pic?: string; desc?: string } | null> {
  try {
    const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.code !== 0 || !data.data) return null;
    return {
      title: data.data.title,
      pic: data.data.pic,
      desc: data.data.desc,
    };
  } catch {
    return null;
  }
}

export const bilibiliRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(bilibiliVideos).orderBy(desc(bilibiliVideos.createdAt));
  }),

  create: adminQuery
    .input(
      z.object({
        url: z.string().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const bvid = extractBvid(input.url);
      if (!bvid) throw new Error("无法从链接中提取BV号");
      const db = getDb();

      // Try to fetch real thumbnail from Bilibili API
      const info = await fetchBilibiliInfo(bvid);
      const thumbnail = info?.pic || "";
      const finalTitle = input.title || info?.title || bvid;
      const finalDesc = input.description || info?.desc || null;

      const result = await db.insert(bilibiliVideos).values({
        bvid,
        title: finalTitle,
        description: finalDesc,
        thumbnail,
      }).returning();

      await logAction(
        ctx.user.id.toString(),
        ctx.user.name ?? "admin",
        "create",
        "video",
        String(result[0].id),
        finalTitle
      );
      return { id: result[0].id, bvid };
    }),

  update: adminQuery
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      thumbnail: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const updates: Record<string, unknown> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.thumbnail !== undefined) updates.thumbnail = input.thumbnail;
      await db.update(bilibiliVideos).set(updates).where(eq(bilibiliVideos.id, input.id));
      await logAction(
        ctx.user.id.toString(),
        ctx.user.name ?? "admin",
        "update",
        "video",
        String(input.id),
        input.title
      );
      return { success: true };
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(bilibiliVideos).where(eq(bilibiliVideos.id, input.id));
      await logAction(
        ctx.user.id.toString(),
        ctx.user.name ?? "admin",
        "delete",
        "video",
        String(input.id),
        undefined
      );
      return { success: true };
    }),
});
