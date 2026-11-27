import { Types } from "mongoose";
import { Supplier, SUPPLIER_STATUSES } from "../models/supplier.model.js";
import { SupplierAssessment } from "../models/supplier-assessment.model.js";
import { AuditEvent } from "../models/audit-event.model.js";
import { AppError } from "../middleware/error-handler.js";

type Actor = { organizationId: string; userId: string };
const audit = (actor: Actor, action: string, resourceType: string, resourceId: string, metadata: Record<string, unknown> = {}) =>
  AuditEvent.create({ organizationId: actor.organizationId, actorUserId: actor.userId, action, resourceType, resourceId, metadata });

function validId(id: string, label: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${label} identifier`, 400, "INVALID_IDENTIFIER");
}
function normalizeName(value: string) { return value.trim().toLocaleLowerCase("en"); }

export async function listSuppliers(organizationId: string, filters: { status?: string; riskLevel?: string; search?: string; page: number; limit: number }) {
  const query: Record<string, unknown> = { organizationId };
  if (filters.status) query.status = filters.status;
  if (filters.riskLevel) query.riskLevel = filters.riskLevel;
  if (filters.search) query.$or = [
    { legalName: { $regex: filters.search, $options: "i" } },
    { displayName: { $regex: filters.search, $options: "i" } },
    { supplierCode: { $regex: filters.search, $options: "i" } }
  ];
  const [items, total] = await Promise.all([
    Supplier.find(query).populate("parentSupplierId", "displayName supplierCode tier").sort({ updatedAt: -1 }).skip((filters.page - 1) * filters.limit).limit(filters.limit).lean(),
    Supplier.countDocuments(query)
  ]);
  return { items, pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) } };
}

export async function getSupplier(organizationId: string, id: string) {
  validId(id, "supplier");
  const supplier = await Supplier.findOne({ _id: id, organizationId }).populate("parentSupplierId", "displayName supplierCode tier").populate("approvedBy", "name email").lean();
  if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
  const [children, assessments] = await Promise.all([
    Supplier.find({ organizationId, parentSupplierId: id }).select("displayName supplierCode tier status riskLevel").lean(),
    SupplierAssessment.find({ organizationId, supplierId: id }).select("title assessmentType status score submittedAt reviewedAt createdAt").sort({ createdAt: -1 }).limit(10).lean()
  ]);
  return { ...supplier, children, assessments };
}

export async function createSupplier(actor: Actor, input: Record<string, any>) {
  const normalizedName = normalizeName(input.legalName);
  if (input.parentSupplierId) {
    validId(input.parentSupplierId, "parent supplier");
    const parent = await Supplier.findOne({ _id: input.parentSupplierId, organizationId: actor.organizationId }).select("_id tier");
    if (!parent) throw new AppError("Parent supplier does not belong to this organization", 400, "INVALID_PARENT_SUPPLIER");
    if (input.parentSupplierId === input._id) throw new AppError("A supplier cannot be its own parent", 400, "SUPPLIER_HIERARCHY_CYCLE");
    input.tier = parent.tier + 1;
  } else input.tier = 1;
  const supplier = await Supplier.create({ ...input, normalizedName, organizationId: actor.organizationId, createdBy: actor.userId, updatedBy: actor.userId });
  await audit(actor, "supplier.created", "supplier", String(supplier._id), { supplierCode: supplier.supplierCode });
  return supplier;
}

export async function updateSupplier(actor: Actor, id: string, input: Record<string, any>) {
  validId(id, "supplier");
  const existing = await Supplier.findOne({ _id: id, organizationId: actor.organizationId });
  if (!existing) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
  if (input.parentSupplierId !== undefined) {
    if (input.parentSupplierId === id) throw new AppError("A supplier cannot be its own parent", 400, "SUPPLIER_HIERARCHY_CYCLE");
    if (input.parentSupplierId) {
      validId(input.parentSupplierId, "parent supplier");
      const parent = await Supplier.findOne({ _id: input.parentSupplierId, organizationId: actor.organizationId }).select("_id tier");
      if (!parent) throw new AppError("Parent supplier does not belong to this organization", 400, "INVALID_PARENT_SUPPLIER");
      const descendants = await Supplier.find({ organizationId: actor.organizationId, parentSupplierId: id }).select("_id").lean();
      if (descendants.some(item => String(item._id) === input.parentSupplierId)) throw new AppError("Supplier hierarchy would contain a cycle", 409, "SUPPLIER_HIERARCHY_CYCLE");
      input.tier = parent.tier + 1;
    } else input.tier = 1;
  }
  if (input.legalName) input.normalizedName = normalizeName(input.legalName);
  Object.assign(existing, input, { updatedBy: actor.userId });
  await existing.save();
  await audit(actor, "supplier.updated", "supplier", id, { changedFields: Object.keys(input) });
  return existing;
}

export async function changeSupplierStatus(actor: Actor, id: string, status: typeof SUPPLIER_STATUSES[number], reason?: string) {
  validId(id, "supplier");
  const supplier = await Supplier.findOne({ _id: id, organizationId: actor.organizationId });
  if (!supplier) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
  const allowed: Record<string, string[]> = {
    prospect: ["onboarding", "suspended"], onboarding: ["under_review", "rejected", "suspended"],
    under_review: ["approved", "rejected", "onboarding", "suspended"],
    approved: ["suspended", "under_review"], rejected: ["onboarding", "suspended"], suspended: ["onboarding", "under_review"]
  };
  if (!allowed[supplier.status]?.includes(status)) throw new AppError(`Cannot transition supplier from ${supplier.status} to ${status}`, 409, "INVALID_SUPPLIER_TRANSITION");
  supplier.status = status;
  supplier.updatedBy = new Types.ObjectId(actor.userId);
  if (status === "approved") { supplier.approvedAt = new Date(); supplier.approvedBy = new Types.ObjectId(actor.userId); }
  if (status === "onboarding" && !supplier.onboardingCompletedAt) supplier.onboardingCompletedAt = null;
  await supplier.save();
  await audit(actor, "supplier.status_changed", "supplier", id, { status, reason: reason ?? null });
  return supplier;
}

export async function listAssessments(organizationId: string, supplierId: string) {
  validId(supplierId, "supplier");
  if (!await Supplier.exists({ _id: supplierId, organizationId })) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
  return SupplierAssessment.find({ organizationId, supplierId }).populate("createdBy", "name email").populate("reviewedBy", "name email").sort({ createdAt: -1 }).lean();
}

export async function createAssessment(actor: Actor, supplierId: string, input: Record<string, any>) {
  validId(supplierId, "supplier");
  if (!await Supplier.exists({ _id: supplierId, organizationId: actor.organizationId })) throw new AppError("Supplier not found", 404, "SUPPLIER_NOT_FOUND");
  const assessment = await SupplierAssessment.create({ ...input, organizationId: actor.organizationId, supplierId, createdBy: actor.userId });
  await audit(actor, "supplier_assessment.created", "supplier_assessment", String(assessment._id));
  return assessment;
}

export async function submitAssessment(actor: Actor, supplierId: string, assessmentId: string) {
  validId(supplierId, "supplier"); validId(assessmentId, "assessment");
  const assessment = await SupplierAssessment.findOne({ _id: assessmentId, supplierId, organizationId: actor.organizationId });
  if (!assessment) throw new AppError("Assessment not found", 404, "ASSESSMENT_NOT_FOUND");
  if (assessment.status !== "draft" || assessment.criteria.length === 0) throw new AppError("Only a draft assessment with criteria can be submitted", 409, "ASSESSMENT_NOT_SUBMITTABLE");
  const totalWeight = assessment.criteria.reduce((sum, item) => sum + item.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) throw new AppError("Assessment criterion weights must total 100", 400, "INVALID_ASSESSMENT_WEIGHTS");
  assessment.score = Math.round(assessment.criteria.reduce((sum, item) => sum + item.score * item.weight, 0) / 5);
  assessment.status = "submitted"; assessment.submittedAt = new Date();
  await assessment.save();
  await audit(actor, "supplier_assessment.submitted", "supplier_assessment", assessmentId, { score: assessment.score });
  return assessment;
}

export async function reviewAssessment(actor: Actor, supplierId: string, assessmentId: string, findings: string, riskLevel: "low" | "medium" | "high" | "critical") {
  validId(supplierId, "supplier"); validId(assessmentId, "assessment");
  const assessment = await SupplierAssessment.findOne({ _id: assessmentId, supplierId, organizationId: actor.organizationId });
  if (!assessment) throw new AppError("Assessment not found", 404, "ASSESSMENT_NOT_FOUND");
  if (assessment.status !== "submitted") throw new AppError("Only submitted assessments can be reviewed", 409, "ASSESSMENT_NOT_REVIEWABLE");
  assessment.status = "reviewed"; assessment.findings = findings; assessment.reviewedAt = new Date(); assessment.reviewedBy = new Types.ObjectId(actor.userId);
  await assessment.save();
  await Supplier.updateOne({ _id: supplierId, organizationId: actor.organizationId }, { $set: { riskLevel, riskScore: assessment.score, updatedBy: actor.userId } });
  await audit(actor, "supplier_assessment.reviewed", "supplier_assessment", assessmentId, { riskLevel, score: assessment.score });
  return assessment;
}
