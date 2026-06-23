import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getStudents, getStudent, updateStudent, deleteStudent,
  getUmkm, getUmkmDetail, updateUmkm, deleteUmkm, verifyUmkm,
  getAdmins, getAdmin, updateAdmin,
} from "../controllers/profileController.js";

export const profileRouter = Router();

profileRouter.get("/students", authenticate, getStudents);
profileRouter.get("/students/:id", authenticate, getStudent);
profileRouter.put("/students/:id", authenticate, updateStudent);
profileRouter.delete("/students/:id", authenticate, authorize("admin"), deleteStudent);

profileRouter.get("/umkm", getUmkm);
profileRouter.get("/umkm/:id", getUmkmDetail);
profileRouter.put("/umkm/:id", authenticate, updateUmkm);
profileRouter.delete("/umkm/:id", authenticate, authorize("admin"), deleteUmkm);
profileRouter.patch("/umkm/:id/verify", authenticate, authorize("admin", "moderator"), verifyUmkm);

profileRouter.get("/admins", authenticate, authorize("admin"), getAdmins);
profileRouter.get("/admins/:id", authenticate, authorize("admin"), getAdmin);
profileRouter.put("/admins/:id", authenticate, authorize("admin"), updateAdmin);
