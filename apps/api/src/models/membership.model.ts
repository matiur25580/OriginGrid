import { Schema, model } from "mongoose";

export const ORGANIZATION_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type OrganizationRole = typeof ORGANIZATION_ROLES[number];

const membershipSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  role: { type: String, enum: ORGANIZATION_ROLES, default: "member", required: true },
  status: { type: String, enum: ["active", "invited", "suspended"], default: "active", index: true },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
export const Membership = model("Membership", membershipSchema);
