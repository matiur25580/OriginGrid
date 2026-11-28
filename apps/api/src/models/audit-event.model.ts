import { Schema, model } from "mongoose";

const auditEventSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, maxlength: 120, index: true },
  resourceType: { type: String, required: true, maxlength: 80 },
  resourceId: { type: String, default: null, maxlength: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  occurredAt: { type: Date, default: Date.now, immutable: true, index: true }
}, { versionKey: false });

auditEventSchema.index({ organizationId: 1, occurredAt: -1 });
export const AuditEvent = model("AuditEvent", auditEventSchema);
