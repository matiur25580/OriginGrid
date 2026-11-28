import { Schema, model } from "mongoose";

const organizationSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

organizationSchema.index({ slug: 1 }, { unique: true });
export const Organization = model("Organization", organizationSchema);
