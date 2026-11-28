import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole, requireTenant } from "../middleware/tenant.middleware.js";
import * as controller from "../controllers/workforce.controller.js";

export const workforceRouter = Router();
const tenant = [requireAuth, requireTenant];
const managers = [...tenant, requireRole("owner", "admin")];

workforceRouter.post("/invitations/accept", requireAuth, controller.acceptInvitation);
workforceRouter.patch("/settings", ...managers, controller.updateOrganization);
workforceRouter.get("/members", ...managers, controller.listMembers);
workforceRouter.patch("/members/:membershipId", ...managers, controller.updateMember);
workforceRouter.post("/invitations", ...managers, controller.createInvitation);
workforceRouter.get("/invitations", ...managers, controller.listInvitations);
workforceRouter.delete("/invitations/:invitationId", ...managers, controller.revokeInvitation);
workforceRouter.get("/departments", ...tenant, controller.listDepartments);
workforceRouter.post("/departments", ...managers, controller.createDepartment);
workforceRouter.patch("/departments/:departmentId", ...managers, controller.updateDepartment);
workforceRouter.delete("/departments/:departmentId", ...managers, controller.deleteDepartment);
workforceRouter.get("/teams", ...tenant, controller.listTeams);
workforceRouter.post("/teams", ...managers, controller.createTeam);
workforceRouter.patch("/teams/:teamId", ...managers, controller.updateTeam);
workforceRouter.delete("/teams/:teamId", ...managers, controller.deleteTeam);
workforceRouter.get("/audit-events", ...managers, controller.listAuditEvents);
