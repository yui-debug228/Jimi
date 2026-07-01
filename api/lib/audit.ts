import { getDb } from "../queries/connection";
import { auditLogs, authDebug } from "@db/schema";

export async function logAction(
  userId: string | undefined,
  userName: string,
  action: string,
  target: string,
  targetId?: string,
  details?: string,
) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      userId,
      userName,
      action,
      target,
      targetId,
      details,
    });
  } catch {
    // Silent fail - don't break operations for logging
  }
}

export async function logAuthDebug(
  event: string,
  details: string,
  headers?: string,
) {
  try {
    const db = getDb();
    await db.insert(authDebug).values({ event, details, headers });
  } catch {
    // Silent fail
  }
}
