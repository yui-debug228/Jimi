import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@db/schema";
import * as relations from "@db/relations";
import path from "path";
import fs from "fs";

const fullSchema = { ...schema, ...relations };

// SQLite database file path (GitHub-friendly: single file, easy to backup)
const DB_DIR = path.resolve(import.meta.dirname, "../../data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, "app.db");

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!instance) {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const db = new Database(DB_PATH);
    // Enable WAL mode for better concurrency and performance
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    instance = drizzle(db, { schema: fullSchema });
  }
  return instance;
}
