import "dotenv/config";

export const env = {
  appId: process.env.APP_ID || "",
  appSecret: process.env.APP_SECRET || "default-secret-change-me-in-production",
  isProduction: process.env.NODE_ENV === "production",
  databasePath: process.env.DATABASE_PATH || "./data/app.db",
  kimiAuthUrl: process.env.KIMI_AUTH_URL || "",
  kimiOpenUrl: process.env.KIMI_OPEN_URL || "",
  ownerUnionId: process.env.OWNER_UNION_ID ?? "",
};
