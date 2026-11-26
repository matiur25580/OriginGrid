import type { RequestHandler } from "express";
import { User } from "../models/user.model.js";
import { AppError } from "./error-handler.js";
import { verifyAccessToken } from "../utils/tokens.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return next(new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
  try {
    const payload = verifyAccessToken(header.slice(7));
    const user = await User.findById(payload.sub).select("_id email status").lean();
    if (!user || user.status !== "active") return next(new AppError("Account is unavailable", 401, "ACCOUNT_UNAVAILABLE"));
    req.auth = { userId: String(user._id), email: user.email };
    next();
  } catch {
    next(new AppError("Invalid or expired access token", 401, "INVALID_ACCESS_TOKEN"));
  }
};
