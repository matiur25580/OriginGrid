import { Schema, model } from "mongoose";

const criterionSchema = new Schema({
  key: { type: String, required: true, trim: true, maxlength: 60 },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  score: { type: Number, min: 0, max: 5, required: true },
  weight: { type: Number, min: 0, max: 100, required: true },
  notes: { type: String, trim: true, maxlength: 1000 }
}, { _id: false });

const evidenceSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  reference: { type: String, required: true, trim: true, maxlength: 500 },
  evidenceType: { type: String, enum: ["certificate", "policy", "audit_report", "questionnaire", "other"], default: "other" },
  expiresAt: { type: Date, default: null }
}, { _id: true });

const assessmentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  assessmentType: { type: String, enum: ["security", "quality", "sustainability", "compliance", "financial", "general"], default: "general" },
  status: { type: String, enum: ["draft", "submitted", "reviewed"], default: "draft", index: true },
  criteria: { type: [criterionSchema], default: [] },
  evidence: { type: [evidenceSchema], default: [] },
  score: { type: Number, min: 0, max: 100, default: null },
  findings: { type: String, trim: true, maxlength: 4000 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  submittedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

assessmentSchema.index({ organizationId: 1, supplierId: 1, createdAt: -1 });
export const SupplierAssessment = model("SupplierAssessment", assessmentSchema);
