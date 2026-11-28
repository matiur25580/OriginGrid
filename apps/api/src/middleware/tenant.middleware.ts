import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { Membership } from "../models/membership.model.js";
import { Organization } from "../models/organization.model.js";
import { AppError } from "./error-handler.js";

export const requireTenant: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.auth) throw new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED");
    const organizationId = req.header("x-organization-id");
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) throw new AppError("A valid X-Organization-Id header is required", 400, "ORGANIZATION_CONTEXT_REQUIRED");
    const membership = await Membership.findOne({ userId: req.auth.userId, organizationId, status: "active" }).lean();
    if (!membership) throw new AppError("You do not have access to this organization", 403, "ORGANIZATION_ACCESS_DENIED");
    const organization = await Organization.findOne({ _id: organizationId, status: "active" }).select("_id").lean();
    if (!organization) throw new AppError("Organization is unavailable", 404, "ORGANIZATION_NOT_FOUND");
    req.tenant = { organizationId: String(organization._id), role: membership.role };
    next();
  } catch (error) { next(error); }
};

export function requireRole(...roles: Array<"owner" | "admin" | "member" | "viewer">): RequestHandler {
  return (req, _res, next) => {
    if (!req.tenant || !roles.includes(req.tenant.role)) return next(new AppError("Insufficient organization permissions", 403, "INSUFFICIENT_ROLE"));
    next();
  };
}
