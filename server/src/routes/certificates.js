import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getCertificates, getCertificate } from "../controllers/certificateController.js";

export const certificateRouter = Router();

certificateRouter.get("/", authenticate, getCertificates);
certificateRouter.get("/:id", authenticate, getCertificate);
