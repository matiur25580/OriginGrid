import { Schema, model } from "mongoose";

const departmentSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  code: { type: String, required: true, trim: true, uppercase: true, maxlength: 20 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  managerMembershipId: { type: Schema.Types.ObjectId, ref: "Membership", default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

departmentSchema.index({ organizationId:  1, code: 1 }, { unique: true });
departmentSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const Department = model("Department", departmentSchema);
