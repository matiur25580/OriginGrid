import { Schema, model } from "mongoose";
export const PRODUCT_STATUSES = ["draft", "active", "retired"] as const;
export const PRODUCT_TYPES = ["finished_good", "component"] as const;
const bomItemSchema = new Schema({
 materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
 quantity: { type: Number, required: true, min: 0.000001 },
 unit: { type: String, required: true, trim: true, lowercase: true, maxlength: 30 }
}, { _id: false });
const productSchema = new Schema({
 organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
 sku: { type: String, required: true, uppercase: true, trim: true, maxlength: 48 },
 name: { type: String, required: true, trim: true, maxlength: 180 },
 description: { type: String, trim: true, maxlength: 3000 },
 category: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
 productType: { type: String, enum: PRODUCT_TYPES, default: "finished_good" },
 brand: { type: String, trim: true, maxlength: 120 },
 modelNumber: { type: String, trim: true, maxlength: 80 },
 gtin: { type: String, trim: true, maxlength: 14, default: null },
 originCountryCode: { type: String, uppercase: true, minlength: 2, maxlength: 2, default: null },
 status: { type: String, enum: PRODUCT_STATUSES, default: "draft", index: true },
 billOfMaterials: { type: [bomItemSchema], default: [] },
 createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
 updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
productSchema.index({ organizationId: 1, gtin: 1 }, { unique: true, partialFilterExpression: { gtin: { $type: "string" } } });
productSchema.index({ organizationId: 1, status: 1, category: 1 });
export const Product = model("Product", productSchema);
