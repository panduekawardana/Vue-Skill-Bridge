import { AppError } from "../utils/AppError.js";

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "SyntaxError" && err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON in request body";
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Duplicate entry. The record already exists.";
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_NO_REFERENCED_ROW") {
    statusCode = 400;
    message = "Referenced record not found";
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

export function notFound(_req, _res, next) {
  next(new AppError("Route not found", 404));
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
