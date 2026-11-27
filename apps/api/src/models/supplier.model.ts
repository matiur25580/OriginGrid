import { Schema, model } from "mongoose";

export const SUPPLIER_STATUSES = ["prospect", "onboarding", "under_review", "approved", "rejected", "suspended"] as const;
export const SUPPLIER_RISK_LEVELS = ["low", "medium", "high", "critical", "unassessed"] as const;

const contactSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
  role: { type: String, trim: true, maxlength: 100 },
  phone: { type: String, trim: true, maxlength: 40 },
  isPrimary: { type: Boolean, default: false }
}, { _id: true });

const siteSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
  addressLine2: { type: String, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  region: { type: String, trim: true, maxlength: 100 },
  postalCode: { type: String, trim: true, maxlength: 24 },
  countryCode: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
  siteType: { type: String, enum: ["headquarters", "manufacturing", "warehouse", "office", "other"], default: "other" }
}, { _id: true });

const supplierSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  legalName: { type: String, required: true, trim: true, maxlength: 180 },
  displayName: { type: String, required: true, trim: true, maxlength: 140 },
  normalizedName: { type: String, required: true, lowercase: true, trim: true },
  supplierCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
  description: { type: String, trim: true, maxlength: 2000 },
  website: { type: String, trim: true, maxlength: 300 },
  countryCode: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
  categories: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
  capabilities: [{ type: String, trim: true, maxlength: 100 }],
  contacts: { type: [contactSchema], default: [] },
  sites: { type: [siteSchema], default: [] },
  parentSupplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null, index: true },
  tier: { type: Number, min: 1, max: 10, default: 1 },
  status: { type: String, enum: SUPPLIER_STATUSES, default: "prospect", index: true },
  riskLevel: { type: String, enum: SUPPLIER_RISK_LEVELS, default: "unassessed", index: true },
  riskScore: { type: Number, min: 0, max: 100, default: null },
  onboardingCompletedAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

supplierSchema.index({ organizationId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, normalizedName: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, status: 1, riskLevel: 1 });
supplierSchema.index({ organizationId: 1, parentSupplierId: 1, tier: 1 });

export const Supplier = model("Supplier", supplierSchema);
