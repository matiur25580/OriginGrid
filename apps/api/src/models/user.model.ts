import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
  emailVerifiedAt: { type: Date, default: null }
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
