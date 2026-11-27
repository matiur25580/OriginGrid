import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole, requireTenant } from "../middleware/tenant.middleware.js";
import * as controller from "../controllers/supplier.controller.js";

export const supplierRouter = Router();
const tenant = [requireAuth, requireTenant];
const managers = [...tenant, requireRole("owner", "admin")];

supplierRouter.get("/", ...tenant, controller.list);
supplierRouter.post("/", ...managers, controller.create);
supplierRouter.get("/:supplierId", ...tenant, controller.get);
supplierRouter.patch("/:supplierId", ...managers, controller.update);
supplierRouter.patch("/:supplierId/status", ...managers, controller.changeStatus);
supplierRouter.get("/:supplierId/assessments", ...tenant, controller.assessments);
supplierRouter.post("/:supplierId/assessments", ...managers, controller.createAssessment);
supplierRouter.post("/:supplierId/assessments/:assessmentId/submit", ...managers, controller.submitAssessment);
supplierRouter.post("/:supplierId/assessments/:assessmentId/review", ...managers, controller.reviewAssessment);
