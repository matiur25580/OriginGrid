import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { Membership } from "../models/membership.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { AppError } from "../middleware/error-handler.js";
import { createRefreshToken, hashToken, signAccessToken } from "../utils/tokens.js";
import { env } from "../config/env.js";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

async function issueSession(user: { _id: unknown; email: string }, familyId?: string) {
  const refresh = createRefreshToken();
  const now = Date.now();
  await RefreshToken.create({
    userId: user._id, tokenHash: refresh.tokenHash, familyId: familyId ?? refresh.familyId,
    expiresAt: new Date(now + REFRESH_TTL_MS)
  });
  return {
    accessToken: signAccessToken({ sub: String(user._id), email: user.email }),
    refreshToken: refresh.token,
    expiresIn: 900
  };
}

export async function register(input: { name: string; email: string; password: string; organizationName: string }) {
  const email = input.email.toLowerCase().trim();
  if (await User.exists({ email })) throw new AppError("An account with this email already exists", 409, "EMAIL_ALREADY_REGISTERED");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name, email, passwordHash });
  let createdOrganizationId: unknown;
  try {
    const baseSlug = slugify(input.organizationName) || "organization";
    let slug = baseSlug;
    for (let attempt = 0; await Organization.exists({ slug }); attempt++) slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
    const organization = await Organization.create({ name: input.organizationName, slug, createdBy: user._id });
    createdOrganizationId = organization._id;
    await Membership.create({ userId: user._id, organizationId: organization._id, role: "owner", status: "active" });
    return { user: { id: String(user._id), name: user.name, email: user.email }, organization: { id: String(organization._id), name: organization.name, slug: organization.slug }, session: await issueSession(user) };
  } catch (error) {
    if (createdOrganizationId) {
      await Membership.deleteMany({ userId: user._id, organizationId: createdOrganizationId });
      await Organization.deleteOne({ _id: createdOrganizationId });
    }
    await User.deleteOne({ _id: user._id });
    throw error;
  }
}

export async function login(emailInput: string, password: string) {
  const user = await User.findOne({ email: emailInput.toLowerCase().trim() }).select("+passwordHash");
  if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Email or password is incorrect", 401, "INVALID_CREDENTIALS");
  }
  return { user: { id: String(user._id), name: user.name, email: user.email }, session: await issueSession(user) };
}

export async function rotateRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  const existing = await RefreshToken.findOne({ tokenHash }).select("+tokenHash");
  if (!existing) throw new AppError("Refresh token is invalid or expired", 401, "INVALID_REFRESH_TOKEN");
  if (existing.revokedAt) {
    await RefreshToken.updateMany({ familyId: existing.familyId, revokedAt: null }, { revokedAt: new Date() });
    throw new AppError("Refresh token reuse detected; session family revoked", 401, "REFRESH_TOKEN_REUSE");
  }
  if (existing.expiresAt <= new Date()) throw new AppError("Refresh token is invalid or expired", 401, "INVALID_REFRESH_TOKEN");
  const user = await User.findById(existing.userId);
  if (!user || user.status !== "active") throw new AppError("Account is unavailable", 401, "ACCOUNT_UNAVAILABLE");
  const next = createRefreshToken();
  const rotated = await RefreshToken.findOneAndUpdate(
    { _id: existing._id, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date(), replacedByHash: next.tokenHash } },
    { new: true }
  );
  if (!rotated) {
    const latest = await RefreshToken.findById(existing._id);
    if (latest?.revokedAt) {
      await RefreshToken.updateMany({ familyId: existing.familyId, revokedAt: null }, { revokedAt: new Date() });
      throw new AppError("Refresh token reuse detected; session family revoked", 401, "REFRESH_TOKEN_REUSE");
    }
    throw new AppError("Refresh token is invalid or expired", 401, "INVALID_REFRESH_TOKEN");
  }
  await RefreshToken.create({ userId: user._id, tokenHash: next.tokenHash, familyId: existing.familyId, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) });
  return { user: { id: String(user._id), name: user.name, email: user.email }, session: { accessToken: signAccessToken({ sub: String(user._id), email: user.email }), refreshToken: next.token, expiresIn: 900 } };
}

export async function revokeRefreshToken(token?: string) {
  if (!token) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { revokedAt: new Date() });
}

export function refreshCookieOptions() {
  return { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" as const, path: `${env.API_PREFIX}/auth`, maxAge: REFRESH_TTL_MS };
}
