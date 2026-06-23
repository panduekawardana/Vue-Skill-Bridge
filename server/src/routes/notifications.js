import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";

export const notificationRouter = Router();

notificationRouter.get("/", authenticate, getNotifications);
notificationRouter.patch("/:id/read", authenticate, markNotificationRead);
notificationRouter.patch("/read-all", authenticate, markAllNotificationsRead);
