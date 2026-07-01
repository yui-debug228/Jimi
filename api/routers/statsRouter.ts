import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, images, bilibiliVideos, likes } from "@db/schema";
import { eq, count, sql } from "drizzle-orm";

export const statsRouter = createRouter({
  dashboard: adminQuery.query(async () => {
    const db = getDb();

    const [userCount] = await db.select({ count: count() }).from(users);
    const [adminCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "admin"));
    const [imgCount] = await db.select({ count: count() }).from(images);
    const [videoCount] = await db.select({ count: count() }).from(bilibiliVideos);
    const [likeCount] = await db.select({ count: count() }).from(likes);

    // Like distribution
    const likeDist = await db
      .select({
        imageId: likes.imageId,
        count: count(),
      })
      .from(likes)
      .groupBy(likes.imageId)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    return {
      totalUsers: userCount?.count ?? 0,
      adminCount: adminCount?.count ?? 0,
      regularUserCount: (userCount?.count ?? 0) - (adminCount?.count ?? 0),
      totalImages: imgCount?.count ?? 0,
      totalVideos: videoCount?.count ?? 0,
      totalLikes: likeCount?.count ?? 0,
      likeDistribution: likeDist.map((d) => ({ imageId: d.imageId, count: d.count })),
    };
  }),
});
