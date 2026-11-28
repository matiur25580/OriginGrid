import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
  replacedByHash: { type: String, default: null }
}, { timestamps: true });

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
export const RefreshToken = model("RefreshToken", refreshTokenSchema);
