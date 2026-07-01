import { createRouter, publicQuery } from "./middleware";
import { imageRouter } from "./routers/imageRouter";
import { bilibiliRouter } from "./routers/bilibiliRouter";
import { authRouter } from "./auth-router";
import { siteConfigRouter } from "./routers/siteConfigRouter";
import { presetImageRouter } from "./routers/presetImageRouter";
import { auditRouter } from "./routers/auditRouter";
import { statsRouter } from "./routers/statsRouter";
import { likeRouter } from "./routers/likeRouter";
import { localAuthRouter } from "./routers/localAuthRouter";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  image: imageRouter,
  bilibili: bilibiliRouter,
  siteConfig: siteConfigRouter,
  presetImage: presetImageRouter,
  audit: auditRouter,
  stats: statsRouter,
  like: likeRouter,
});

export type AppRouter = typeof appRouter;
