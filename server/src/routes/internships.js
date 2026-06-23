import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getNeeds, getNeed, createNeed, updateNeed, deleteNeed, updateNeedStatus,
  getInternships, getInternship, updateInternshipStatus, addDailyLog,
} from "../controllers/internshipController.js";

export const internshipRouter = Router();

internshipRouter.get("/needs", getNeeds);
internshipRouter.get("/needs/:id", getNeed);
internshipRouter.post("/needs", authenticate, authorize("umkm", "admin"), createNeed);
internshipRouter.put("/needs/:id", authenticate, updateNeed);
internshipRouter.delete("/needs/:id", authenticate, authorize("admin"), deleteNeed);
internshipRouter.patch("/needs/:id/status", authenticate, authorize("umkm", "admin"), updateNeedStatus);

internshipRouter.get("/list", authenticate, getInternships);
internshipRouter.get("/list/:id", authenticate, getInternship);
internshipRouter.patch("/list/:id/status", authenticate, updateInternshipStatus);
internshipRouter.post("/list/:id/daily-log", authenticate, authorize("student"), addDailyLog);
