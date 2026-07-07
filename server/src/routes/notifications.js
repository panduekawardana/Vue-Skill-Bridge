import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";

export const notificationRouter = Router();

notificationRouter.get("/", authenticate, getNotifications);
notificationRouter.get("/unread-count", authenticate, getUnreadCount);
notificationRouter.patch("/:id/read", authenticate, markNotificationRead);
notificationRouter.patch("/read-all", authenticate, markAllNotificationsRead);
