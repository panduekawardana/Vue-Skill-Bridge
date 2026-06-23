import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.js";
import { notifications } from "../db/schema/notifications.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { isRead, type } = req.query;
  const conditions = [eq(notifications.userId, req.user.userId)];

  if (isRead !== undefined) conditions.push(eq(notifications.isRead, isRead === "true"));
  if (type) conditions.push(eq(notifications.type, type));

  const result = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));

  res.json(result);
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
