import {
  sqliteTable,
  integer,
  text,
} from "drizzle-orm/sqlite-core";

// ─── Site-wide configuration ───
export const siteConfig = sqliteTable("site_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Preset images for gallery ───
export const presetImages = sqliteTable("preset_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slot: text("slot").notNull().unique(),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Gallery images (uploaded by admin) ───
export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  category: text("category"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Bilibili videos ───
export const bilibiliVideos = sqliteTable("bilibili_videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bvid: text("bvid").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail: text("thumbnail"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Users (OAuth + local) ───
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  unionId: text("unionId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Likes on images (by logged-in users) ───
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageId: integer("image_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Audit logs for admin actions ───
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  target: text("target").notNull(),
  targetId: text("target_id"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ─── Auth debug logs ───
export const authDebug = sqliteTable("auth_debug", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  details: text("details"),
  headers: text("headers"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
