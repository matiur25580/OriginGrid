import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireTenant } from "../middleware/tenant.middleware.js";

export const organizationRouter = Router();
organizationRouter.get("/context", requireAuth, requireTenant, (req, res) => {
  res.json({ success: true, data: { organizationId: req.tenant?.organizationId, role: req.tenant?.role } });
});
