import { Router } from "express";
import { authRouter } from "./auth.js";
import { profileRouter } from "./profiles.js";
import { internshipRouter } from "./internships.js";
import { skillTestRouter } from "./skillTests.js";
import { matchmakingRouter } from "./matchmakingRoutes.js";
import { evaluationRouter } from "./evaluations.js";
import { certificateRouter } from "./certificates.js";
import { notificationRouter } from "./notifications.js";
import { adminRouter } from "./admin.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/profiles", profileRouter);
router.use("/internships", internshipRouter);
router.use("/skill-test", skillTestRouter);
router.use("/matchmaking", matchmakingRouter);
router.use("/evaluations", evaluationRouter);
router.use("/certificates", certificateRouter);
router.use("/notifications", notificationRouter);
router.use("/admin", adminRouter);

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
