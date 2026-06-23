import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Access denied. No token provided.", 401));
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return next(new AppError("Invalid or expired token.", 401));
  }
}

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden. Insufficient permissions.", 403));
    }
    next();
  };
}
