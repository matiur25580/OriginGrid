import { Types } from "mongoose";
import { Material } from "../models/material.model.js";
import { Product } from "../models/product.model.js";
import { Supplier } from "../models/supplier.model.js";
import { AuditEvent } from "../models/audit-event.model.js";
import { AppError } from "../middleware/error-handler.js";
import { normalizeCatalogCode, normalizeCatalogName, validateBillOfMaterials, validateComposition } from "./catalog.rules.js";
type Actor = { organizationId: string; userId: string };
type PageFilters = { page: number; limit: number; search?: string; status?: string; category?: string };
type OptionalInput<T> = { [K in keyof T]?: T[K] | undefined };
type MaterialInput = { materialCode: string; name: string; category: string; unitOfMeasure: string; description?: string | undefined; countryOfOrigin?: string | null | undefined; supplierId?: string | null | undefined; composition?: Array<{ substance: string; percentage: number }> | undefined; recycledContentPercent?: number | undefined; status?: "draft" | "active" | "discontinued" | undefined };
type ProductInput = { sku: string; name: string; category: string; description?: string | undefined; productType?: "finished_good" | "component" | undefined; brand?: string | undefined; modelNumber?: string | undefined; gtin?: string | null | undefined; originCountryCode?: string | null | undefined; status?: "draft" | "active" | "retired" | undefined; billOfMaterials?: Array<{ materialId: string; quantity: number; unit: string }> | undefined };
const audit = (actor: Actor, action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown> = {}) => AuditEvent.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action, resourceType, resourceId, metadata });
function validId(id: string, label: string) { if (!Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} identifier`, 400, "INVALID_IDENTIFIER"); }
function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function buildFilter(organizationId: string, filters: PageFilters, searchFields: string[]) {
 const query: Record<string, unknown> = { organizationId };
 if (filters.status) query.status = filters.status;
 if (filters.category) query.category = filters.category.toLocaleLowerCase("en");
 if (filters.search) {
  const pattern = new RegExp(escapeRegex(filters.search), "i");
  query.$or = searchFields.map(field => ({ [field]: pattern }));
 }
 return query;
}
async function validateBom(organizationId: string, items: NonNullable<ProductInput["billOfMaterials"]>) {
 try { validateBillOfMaterials(items); } catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid bill of materials", 400, "INVALID_BILL_OF_MATERIALS"); }
 if (items.length === 0) return;
 const ids = items.map(item => item.materialId);
 if (ids.some(id => !Types.ObjectId.isValid(id))) throw new AppError("Bill of materials contains an invalid material identifier", 400, "INVALID_MATERIAL_IDENTIFIER");
 const count = await Material.countDocuments({ organizationId, _id: { $in: ids }, status: "active" });
 if (count !== ids.length) throw new AppError("Every bill-of-materials material must be active and belong to this organization", 400, "INVALID_BILL_OF_MATERIALS_MATERIAL");
}
export async function listProducts(organizationId: string, filters: PageFilters) {
 const query = buildFilter(organizationId, filters, ["name", "category", "sku", "brand"]);
 const [items, total] = await Promise.all([Product.find(query).select("-__v").sort({ updatedAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(), Product.countDocuments(query)]);
 return { items, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}
export async function getProduct(organizationId: string, id: string) {
 validId(id, "product");
 const product = await Product.findOne({ _id: id, organizationId }).populate("billOfMaterials.materialId", "materialCode name category unitOfMeasure status").lean();
 if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
 return product;
}
export async function createProduct(actor: Actor, input: ProductInput) {
 const billOfMaterials = input.billOfMaterials ?? [];
 await validateBom(actor.organizationId, billOfMaterials);
 const product = await Product.create({ ...input, sku: normalizeCatalogCode(input.sku), billOfMaterials, organizationId: actor.organizationId, createdBy: actor.userId, updatedBy: actor.userId });
 await audit(actor, "product.created", "product", String(product._id), { sku: product.sku, bomItems: billOfMaterials.length });
 return product;
}
export async function updateProduct(actor: Actor, id: string, input: OptionalInput<ProductInput>) {
 validId(id, "product");
 const product = await Product.findOne({ _id: id, organizationId: actor.organizationId });
 if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
 if (input.billOfMaterials !== undefined) await validateBom(actor.organizationId, input.billOfMaterials);
 const update: Record<string, unknown> = { ...input, updatedBy: actor.userId };
 if (input.sku !== undefined) update.sku = normalizeCatalogCode(input.sku);
 Object.assign(product, update);
 await product.save();
 await audit(actor, "product.updated", "product", id, { changedFields: Object.keys(input) });
 return product;
}
export async function listMaterials(organizationId: string, filters: PageFilters) {
 const query = buildFilter(organizationId, filters, ["name", "category", "materialCode"]);
 const [items, total] = await Promise.all([Material.find(query).populate("supplierId", "supplierCode displayName status").select("-__v").sort({ updatedAt: -1, _id: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(), Material.countDocuments(query)]);
 return { items, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}
export async function getMaterial(organizationId: string, id: string) {
 validId(id, "material");
 const material = await Material.findOne({ _id: id, organizationId }).populate("supplierId", "supplierCode displayName status").lean();
 if (!material) throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
 return material;
}
async function validateMaterialReferences(organizationId: string, supplierId?: string | null) {
 if (!supplierId) return;
 validId(supplierId, "supplier");
 if (!await Supplier.exists({ _id: supplierId, organizationId })) throw new AppError("Supplier does not belong to this organization", 400, "INVALID_SUPPLIER_REFERENCE");
}
function checkComposition(input: MaterialInput) {
 try { validateComposition(input.composition ?? []); } catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid composition", 400, "INVALID_MATERIAL_COMPOSITION"); }
}
export async function createMaterial(actor: Actor, input: MaterialInput) {
 checkComposition(input);
 await validateMaterialReferences(actor.organizationId, input.supplierId);
 const material = await Material.create({ ...input, materialCode: normalizeCatalogCode(input.materialCode), normalizedName: normalizeCatalogName(input.name), composition: input.composition ?? [], organizationId: actor.organizationId, createdBy: actor.userId, updatedBy: actor.userId });
 await audit(actor, "material.created", "material", String(material._id), { materialCode: material.materialCode });
 return material;
}
export async function updateMaterial(actor: Actor, id: string, input: OptionalInput<MaterialInput>) {
 validId(id, "material");
 const material = await Material.findOne({ _id: id, organizationId: actor.organizationId });
 if (!material) throw new AppError("Material not found", 404, "MATERIAL_NOT_FOUND");
 if (input.supplierId !== undefined) await validateMaterialReferences(actor.organizationId, input.supplierId);
 if (input.composition !== undefined) { try { validateComposition(input.composition); } catch (error) { throw new AppError(error instanceof Error ? error.message : "Invalid composition", 400, "INVALID_MATERIAL_COMPOSITION"); } }
 const update: Record<string, unknown> = { ...input, updatedBy: actor.userId };
 if (input.materialCode !== undefined) update.materialCode = normalizeCatalogCode(input.materialCode);
 if (input.name !== undefined) update.normalizedName = normalizeCatalogName(input.name);
 Object.assign(material, update);
 await material.save();
 await audit(actor, "material.updated", "material", id, { changedFields: Object.keys(input) });
 return material;
}
