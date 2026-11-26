import type { RequestHandler } from "express";
import { AppError } from "./error-handler.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.auth = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401, "INVALID_ACCESS_TOKEN"));
  }
};
