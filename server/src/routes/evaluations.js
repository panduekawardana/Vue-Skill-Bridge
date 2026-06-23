import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { createEvaluation, getEvaluations, getEvaluation } from "../controllers/evaluationController.js";

export const evaluationRouter = Router();

evaluationRouter.post("/", authenticate, createEvaluation);
evaluationRouter.get("/", authenticate, getEvaluations);
evaluationRouter.get("/:id", authenticate, getEvaluation);
