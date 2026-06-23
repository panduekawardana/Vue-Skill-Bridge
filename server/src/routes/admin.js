import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllAdmins,
  createAdmin,
} from "../controllers/adminController.js";
import {
  createTicket,
  getTickets,
  getTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/ticketController.js";

export const adminRouter = Router();

adminRouter.use(authenticate, authorize("admin"));

adminRouter.get("/dashboard", getDashboardStats);
adminRouter.get("/users", getUsers);
adminRouter.get("/users/:id", getUser);
adminRouter.patch("/users/:id", updateUser);
adminRouter.delete("/users/:id", deleteUser);
adminRouter.get("/admins", getAllAdmins);
adminRouter.post("/admins", createAdmin);
adminRouter.post("/tickets", createTicket);
adminRouter.get("/tickets", getTickets);
adminRouter.get("/tickets/:id", getTicket);
adminRouter.patch("/tickets/:id", updateTicket);
adminRouter.delete("/tickets/:id", deleteTicket);
