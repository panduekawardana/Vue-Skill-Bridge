import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getCertificates, getCertificate, downloadCertificate, verifyCertificate } from "../controllers/certificateController.js";

export const certificateRouter = Router();

certificateRouter.get("/", authenticate, getCertificates);
certificateRouter.get("/:id", authenticate, getCertificate);
certificateRouter.get("/:id/download", authenticate, downloadCertificate);
certificateRouter.get("/verify/:certNumber", verifyCertificate);
