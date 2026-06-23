import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { getMatches, getMatch, respondToMatch, createMatch, studentApplyToNeed } from "../controllers/matchmakingController.js";

export const matchmakingRouter = Router();

matchmakingRouter.get("/", authenticate, getMatches);
matchmakingRouter.get("/:id", authenticate, getMatch);
matchmakingRouter.post("/:id/respond", authenticate, respondToMatch);
matchmakingRouter.post("/apply/:needId", authenticate, authorize("student"), studentApplyToNeed);
matchmakingRouter.post("/", authenticate, authorize("admin"), createMatch);
