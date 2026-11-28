import type { OrganizationRole } from "../models/membership.model.js";

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; email: string };
      tenant?: { organizationId: string; role: OrganizationRole };
    }
  }
}
export {};
