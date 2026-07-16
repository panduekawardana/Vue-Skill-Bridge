import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000").split(",");

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

// Simple in-memory rate limiting
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 60;

function rateLimit(req, res, next) {
  const key = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { start: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Terlalu banyak request. Coba lagi nanti." });
  }
  next();
}

// Stricter rate limit for auth endpoints
const authRateLimitStore = new Map();
const AUTH_RATE_LIMIT_MAX = 10;

function authRateLimit(req, res, next) {
  const key = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  const record = authRateLimitStore.get(key);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    authRateLimitStore.set(key, { start: now, count: 1 });
    return next();
  }
  record.count++;
  if (record.count > AUTH_RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." });
  }
  next();
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (now - record.start > RATE_LIMIT_WINDOW * 2) rateLimitStore.delete(key);
  }
  for (const [key, record] of authRateLimitStore) {
    if (now - record.start > RATE_LIMIT_WINDOW * 2) authRateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

app.get("/", (_req, res) => {
  res.json({ message: "Skill Bridge API is running" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", rateLimit);
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
