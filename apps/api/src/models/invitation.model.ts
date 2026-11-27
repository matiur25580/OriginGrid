import { Schema, model } from "mongoose";

const invitationSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["admin", "member", "viewer"], default: "member", required: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  acceptedAt: { type: Date, default: null },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

invitationSchema.index({ organizationId: 1, email: 1, acceptedAt: 1, revokedAt: 1 });
export const Invitation = model("Invitation", invitationSchema);
