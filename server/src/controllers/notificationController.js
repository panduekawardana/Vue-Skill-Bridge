import crypto from "crypto";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { notifications } from "../db/schema/notifications.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

function generateId() {
  return crypto.randomUUID();
}

// ─── CENTRALIZED NOTIFICATION CREATOR ─────────────────────

export async function createNotification({ userId, type, title, body, channel = "in_app", referenceId = null }) {
  const validTypes = ["match", "schedule", "evaluation", "certificate", "system"];
  const validChannels = ["in_app", "whatsapp", "email"];

  if (!validTypes.includes(type)) throw new Error(`Invalid notification type: ${type}`);
  if (!validChannels.includes(channel)) throw new Error(`Invalid channel: ${channel}`);

  const id = generateId();

  await db.insert(notifications).values({
    id,
    userId,
    type,
    title,
    body: body || null,
    channel,
    referenceId: referenceId || null,
  });

  return id;
}

// ─── REST API ─────────────────────────────────────────────

export const getNotifications = asyncHandler(async (req, res) => {
  const { isRead, type, limit: queryLimit } = req.query;
  const conditions = [eq(notifications.userId, req.user.userId)];

  if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead === "true"));
  if (type) conditions.push(eq(notifications.type, type));

  let query = db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  if (queryLimit) {
    query = query.limit(Number(queryLimit));
  }

  const result = await query;
  res.json(result);
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const [result] = await db
    .select({ count: sql`COUNT(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, req.user.userId), eq(notifications.isRead, false)));

  res.json({ count: Number(result?.count || 0) });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const [notif] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, req.params.id), eq(notifications.userId, req.user.userId)))
    .limit(1);

  if (!notif) throw new AppError("Notification not found", 404);

  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, req.params.id));

  res.json({ message: "Notification marked as read" });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notifications.userId, req.user.userId), eq(notifications.isRead, false)));

  res.json({ message: "All notifications marked as read" });
});
