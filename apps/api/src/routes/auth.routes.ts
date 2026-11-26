import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, refresh, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const authRouter = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, error: { code: "RATE_LIMITED", message: "Too many authentication attempts. Try again later." } } });

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.post("/refresh", authLimiter, refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
