import { Schema, model } from "mongoose";
export const MATERIAL_STATUSES = ["draft", "active", "discontinued"] as const;
const compositionSchema = new Schema({ substance: { type: String, required: true, trim: true, maxlength: 120 }, percentage: { type: Number, required: true, min: 0, max: 100 } }, { _id: false });
const materialSchema = new Schema({
 organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
 materialCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
 name: { type: String, required: true, trim: true, maxlength: 160 },
 normalizedName: { type: String, required: true, lowercase: true, trim: true },
 category: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
 description: { type: String, trim: true, maxlength: 2000 },
 unitOfMeasure: { type: String, required: true, trim: true, lowercase: true, maxlength: 30 },
 countryOfOrigin: { type: String, uppercase: true, minlength: 2, maxlength: 2, default: null },
 supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", default: null, index: true },
 composition: { type: [compositionSchema], default: [] },
 recycledContentPercent: { type: Number, min: 0, max: 100, default: 0 },
 status: { type: String, enum: MATERIAL_STATUSES, default: "draft", index: true },
 createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
 updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
materialSchema.index({ organizationId: 1, materialCode: 1 }, { unique: true });
materialSchema.index({ organizationId: 1, normalizedName: 1, category: 1 });
materialSchema.index({ organizationId: 1, status: 1, category: 1 });
export const Material = model("Material", materialSchema);
