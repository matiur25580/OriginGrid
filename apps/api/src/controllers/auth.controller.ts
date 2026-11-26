import type { RequestHandler } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service.js";
import { User } from "../models/user.model.js";
import { Membership } from "../models/membership.model.js";
import { Organization } from "../models/organization.model.js";
import { AppError } from "../middleware/error-handler.js";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  organizationName: z.string().trim().min(2).max(160)
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.register(registerSchema.parse(req.body));
    res.cookie("og_refresh", result.session.refreshToken, authService.refreshCookieOptions());
    res.status(201).json({ success: true, data: { user: result.user, organization: result.organization, accessToken: result.session.accessToken, expiresIn: result.session.expiresIn } });
  } catch (error) { next(error); }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input.email, input.password);
    res.cookie("og_refresh", result.session.refreshToken, authService.refreshCookieOptions());
    res.json({ success: true, data: { user: result.user, accessToken: result.session.accessToken, expiresIn: result.session.expiresIn } });
  } catch (error) { next(error); }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.og_refresh as string | undefined;
    if (!token) throw new AppError("Refresh session is required", 401, "REFRESH_SESSION_REQUIRED");
    const result = await authService.rotateRefreshToken(token);
    res.cookie("og_refresh", result.session.refreshToken, authService.refreshCookieOptions());
    res.json({ success: true, data: { user: result.user, accessToken: result.session.accessToken, expiresIn: result.session.expiresIn } });
  } catch (error) { next(error); }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    await authService.revokeRefreshToken(req.cookies?.og_refresh as string | undefined);
    res.clearCookie("og_refresh", authService.refreshCookieOptions());
    res.status(204).send();
  } catch (error) { next(error); }
};

export const me: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const user = await User.findById(req.auth.userId).select("name email status createdAt").lean();
    if (!user || user.status !== "active") throw new AppError("Account is unavailable", 401, "ACCOUNT_UNAVAILABLE");
    const memberships = await Membership.find({ userId: user._id, status: "active" }).lean();
    const organizations = await Organization.find({ _id: { $in: memberships.map(m => m.organizationId) }, status: "active" }).select("name slug").lean();
    const membershipByOrg = new Map(memberships.map(m => [String(m.organizationId), m.role]));
    res.json({ success: true, data: { user: { id: String(user._id), name: user.name, email: user.email }, organizations: organizations.map(org => ({ id: String(org._id), name: org.name, slug: org.slug, role: membershipByOrg.get(String(org._id)) })) } });
  } catch (error) { next(error); }
};
