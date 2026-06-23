import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion,
  startAttempt, getAttempts, getAttempt, submitAttempt,
  getResults, getResult,
} from "../controllers/skillTestController.js";

export const skillTestRouter = Router();

skillTestRouter.get("/questions", getQuestions);
skillTestRouter.get("/questions/:id", getQuestion);
skillTestRouter.post("/questions", authenticate, authorize("admin", "moderator"), createQuestion);
skillTestRouter.put("/questions/:id", authenticate, authorize("admin", "moderator"), updateQuestion);
skillTestRouter.delete("/questions/:id", authenticate, authorize("admin", "moderator"), deleteQuestion);

skillTestRouter.post("/attempts", authenticate, authorize("student"), startAttempt);
skillTestRouter.get("/attempts", authenticate, authorize("student"), getAttempts);
skillTestRouter.get("/attempts/:id", authenticate, getAttempt);
skillTestRouter.post("/attempts/:id/submit", authenticate, authorize("student"), submitAttempt);

skillTestRouter.get("/results", authenticate, getResults);
skillTestRouter.get("/results/:id", authenticate, getResult);
