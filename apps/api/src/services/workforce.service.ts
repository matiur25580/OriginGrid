import { createHash, randomBytes } from "node:crypto";
import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { Membership } from "../models/membership.model.js";
import { Invitation } from "../models/invitation.model.js";
import { Department } from "../models/department.model.js";
import { Team } from "../models/team.model.js";
import { AuditEvent } from "../models/audit-event.model.js";
import { AppError } from "../middleware/error-handler.js";
import type { OrganizationRole } from "../models/membership.model.js";

const inviteTokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const audit = (organizationId: string, actorUserId: string, action: string, resourceType: string, resourceId?: string, metadata: Record<string, unknown> = {}) =>
  AuditEvent.create({ organizationId, actorUserId, action, resourceType, resourceId, metadata });

export async function updateOrganization(organizationId: string, actorUserId: string, input: { name?: string }) {
  const organization = await Organization.findOneAndUpdate({ _id: organizationId, status: "active" }, { $set: input }, { new: true, runValidators: true }).select("name slug status updatedAt");
  if (!organization) throw new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");
  await audit(organizationId, actorUserId, "organization.updated", "organization", organizationId, { changedFields: Object.keys(input) });
  return organization;
}

export async function listMembers(organizationId: string) {
  return Membership.find({ organizationId }).populate("userId", "name email status").populate("departmentId", "name code").populate("teamIds", "name").sort({ createdAt: 1 }).lean();
}

export async function updateMember(organizationId: string, actorUserId: string, actorRole: OrganizationRole, membershipId: string, input: { role?: OrganizationRole; status?: "active" | "suspended"; departmentId?: string | null; teamIds?: string[] }) {
  if (!Types.ObjectId.isValid(membershipId)) throw new AppError("Invalid membership identifier", 400, "INVALID_MEMBERSHIP_ID");
  const membership = await Membership.findOne({ _id: membershipId, organizationId });
  if (!membership) throw new AppError("Membership not found", 404, "MEMBERSHIP_NOT_FOUND");
  if (membership.role === "owner") throw new AppError("Owner membership must be transferred through the ownership workflow", 409, "OWNER_PROTECTED");
  if (input.role === "owner") throw new AppError("Ownership cannot be assigned through role editing", 400, "OWNER_TRANSFER_REQUIRED");
  if (actorRole === "admin" && (membership.role === "admin" || input.role === "admin")) throw new AppError("Only an organization owner can manage administrator roles", 403, "ADMIN_ROLE_PROTECTED");
  if (input.departmentId) {
    if (!Types.ObjectId.isValid(input.departmentId) || !(await Department.exists({ _id: input.departmentId, organizationId }))) throw new AppError("Department does not belong to this organization", 400, "INVALID_DEPARTMENT");
    membership.departmentId = new Types.ObjectId(input.departmentId);
  } else if (input.departmentId === null) membership.departmentId = null;
  if (input.teamIds) {
    if (input.teamIds.some(id => !Types.ObjectId.isValid(id))) throw new AppError("Invalid team identifier", 400, "INVALID_TEAM");
    const count = await Team.countDocuments({ _id: { $in: input.teamIds }, organizationId });
    if (count !== new Set(input.teamIds).size) throw new AppError("One or more teams do not belong to this organization", 400, "INVALID_TEAM");
    membership.teamIds = input.teamIds.map(id => new Types.ObjectId(id));
  }
  if (input.role) membership.role = input.role;
  if (input.status) membership.status = input.status;
  await membership.save();
  await audit(organizationId, actorUserId, "membership.updated", "membership", membershipId, { changedFields: Object.keys(input) });
  return membership;
}

export async function createInvitation(organizationId: string, actorUserId: string, input: { email: string; role: "admin" | "member" | "viewer" }) {
  const email = input.email.toLowerCase().trim();
  const existingUser = await User.findOne({ email }).select("_id");
  if (existingUser && await Membership.exists({ userId: existingUser._id, organizationId })) throw new AppError("User is already a member of this organization", 409, "ALREADY_A_MEMBER");
  const pending = await Invitation.findOne({ organizationId, email, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (pending) throw new AppError("A pending invitation already exists for this email", 409, "INVITATION_ALREADY_PENDING");
  const token = randomBytes(32).toString("base64url");
  const invitation = await Invitation.create({ organizationId, email, role: input.role, tokenHash: inviteTokenHash(token), invitedBy: actorUserId, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await audit(organizationId, actorUserId, "invitation.created", "invitation", String(invitation._id), { email, role: input.role });
  return { invitation: { id: String(invitation._id), email, role: invitation.role, expiresAt: invitation.expiresAt }, invitationToken: token };
}

export async function listInvitations(organizationId: string) {
  return Invitation.find({ organizationId }).select("-tokenHash").sort({ createdAt: -1 }).lean();
}

export async function revokeInvitation(organizationId: string, actorUserId: string, invitationId: string) {
  if (!Types.ObjectId.isValid(invitationId)) throw new AppError("Invalid invitation identifier", 400, "INVALID_INVITATION_ID");
  const invitation = await Invitation.findOneAndUpdate({ _id: invitationId, organizationId, acceptedAt: null, revokedAt: null }, { $set: { revokedAt: new Date() } }, { new: true }).select("-tokenHash");
  if (!invitation) throw new AppError("Pending invitation not found", 404, "INVITATION_NOT_FOUND");
  await audit(organizationId, actorUserId, "invitation.revoked", "invitation", invitationId);
  return invitation;
}

export async function acceptInvitation(userId: string, token: string) {
  const user = await User.findById(userId).select("_id email status");
  if (!user || user.status !== "active") throw new AppError("Account is unavailable", 401, "ACCOUNT_UNAVAILABLE");
  const invitation = await Invitation.findOne({ tokenHash: inviteTokenHash(token), acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }).select("+tokenHash");
  if (!invitation) throw new AppError("Invitation is invalid, expired, or revoked", 400, "INVITATION_INVALID");
  if (user.email.toLowerCase() !== invitation.email) throw new AppError("Sign in with the email address that received this invitation", 403, "INVITATION_EMAIL_MISMATCH");
  const organization = await Organization.findOne({ _id: invitation.organizationId, status: "active" }).select("_id");
  if (!organization) throw new AppError("Organization is unavailable", 404, "ORGANIZATION_NOT_FOUND");
  try {
    await Membership.create({ userId: user._id, organizationId: invitation.organizationId, role: invitation.role, status: "active" });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
  }
  const accepted = await Invitation.findOneAndUpdate({ _id: invitation._id, acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } }, { $set: { acceptedAt: new Date() } }, { new: true });
  if (!accepted) throw new AppError("Invitation has already been used", 409, "INVITATION_ALREADY_USED");
  await audit(String(invitation.organizationId), userId, "invitation.accepted", "invitation", String(invitation._id), { email: user.email });
  return { organizationId: String(invitation.organizationId), role: invitation.role };
}

export async function listDepartments(organizationId: string) {
  return Department.find({ organizationId }).sort({ name: 1 }).lean();
}

export async function createDepartment(organizationId: string, actorUserId: string, input: { name: string; code: string; description?: string | undefined }) {
  const department = await Department.create({ organizationId, ...input, createdBy: actorUserId });
  await audit(organizationId, actorUserId, "department.created", "department", String(department._id));
  return department;
}

export async function updateDepartment(organizationId: string, actorUserId: string, id: string, input: { name?: string; code?: string; description?: string }) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid department identifier", 400, "INVALID_DEPARTMENT_ID");
  const department = await Department.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true });
  if (!department) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  await audit(organizationId, actorUserId, "department.updated", "department", id, { changedFields: Object.keys(input) });
  return department;
}

export async function deleteDepartment(organizationId: string, actorUserId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid department identifier", 400, "INVALID_DEPARTMENT_ID");
  const department = await Department.findOne({ _id: id, organizationId });
  if (!department) throw new AppError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  if (await Team.exists({ organizationId, departmentId: id })) throw new AppError("Move or delete this department's teams before deleting it", 409, "DEPARTMENT_HAS_TEAMS");
  await Membership.updateMany({ organizationId, departmentId: id }, { $set: { departmentId: null } });
  await department.deleteOne();
  await audit(organizationId, actorUserId, "department.deleted", "department", id);
}

export async function listTeams(organizationId: string) {
  return Team.find({ organizationId }).populate("departmentId", "name code").sort({ name: 1 }).lean();
}

export async function createTeam(organizationId: string, actorUserId: string, input: { name: string; description?: string | undefined; departmentId?: string | null | undefined }) {
  if (input.departmentId && !(await Department.exists({ _id: input.departmentId, organizationId }))) throw new AppError("Department does not belong to this organization", 400, "INVALID_DEPARTMENT");
  const team = await Team.create({ organizationId, ...input, createdBy: actorUserId });
  await audit(organizationId, actorUserId, "team.created", "team", String(team._id));
  return team;
}

export async function updateTeam(organizationId: string, actorUserId: string, id: string, input: { name?: string; description?: string | undefined; departmentId?: string | null | undefined }) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid team identifier", 400, "INVALID_TEAM_ID");
  if (input.departmentId && !(await Department.exists({ _id: input.departmentId, organizationId }))) throw new AppError("Department does not belong to this organization", 400, "INVALID_DEPARTMENT");
  const team = await Team.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true });
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  await audit(organizationId, actorUserId, "team.updated", "team", id, { changedFields: Object.keys(input) });
  return team;
}

export async function deleteTeam(organizationId: string, actorUserId: string, id: string) {
  if (!Types.ObjectId.isValid(id)) throw new AppError("Invalid team identifier", 400, "INVALID_TEAM_ID");
  const team = await Team.findOne({ _id: id, organizationId });
  if (!team) throw new AppError("Team not found", 404, "TEAM_NOT_FOUND");
  await Membership.updateMany({ organizationId, teamIds: id }, { $pull: { teamIds: id } });
  await team.deleteOne();
  await audit(organizationId, actorUserId, "team.deleted", "team", id);
}

export async function listAuditEvents(organizationId: string, page: number, limit: number) {
  const [items, total] = await Promise.all([
    AuditEvent.find({ organizationId }).populate("actorUserId", "name email").sort({ occurredAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditEvent.countDocuments({ organizationId })
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}
