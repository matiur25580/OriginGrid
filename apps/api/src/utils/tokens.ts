import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { algorithm: "HS256", expiresIn: "15m", issuer: "origingrid-api", audience: "origingrid-web" });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"], issuer: "origingrid-api", audience: "origingrid-web" });
  if (typeof decoded === "string" || !decoded.sub || !decoded.email) throw new Error("Invalid access token");
  return { sub: decoded.sub, email: decoded.email };
}

export function createRefreshToken(): { token: string; tokenHash: string; familyId: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashToken(token), familyId: randomUUID() };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
