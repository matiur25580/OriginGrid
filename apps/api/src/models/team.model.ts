import { Schema, model } from "mongoose";

const teamSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  departmentId: { type: Schema.Types.ObjectId, ref: "Department", default: null, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  leadMembershipId: { type: Schema.Types.ObjectId, ref: "Membership", default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

teamSchema.index({ organizationId: 1, name: 1 }, { unique: true });
export const Team = model("Team", teamSchema);
