import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { auditLogs, authDebug } from "@db/schema";
import { desc } from "drizzle-orm";

export const auditRouter = createRouter({
  list: adminQuery
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 100;
      return db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(limit);
    }),

  authDebug: adminQuery
    .input(z.object({ limit: z.number().min(1).max(500).optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      return db.select().from(authDebug).orderBy(desc(authDebug.id)).limit(limit);
    }),
});
