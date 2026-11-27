import type { RequestHandler } from "express";
import { z } from "zod";
import * as workforce from "../services/workforce.service.js";

const organizationSchema = z.object({ name: z.string().trim().min(2).max(160) });
const invitationSchema = z.object({ email: z.string().trim().email().max(254), role: z.enum(["admin", "member", "viewer"]).default("member") });
const memberSchema = z.object({ role: z.enum(["admin", "member", "viewer"]).optional(), status: z.enum(["active", "suspended"]).optional(), departmentId: z.string().nullable().optional(), teamIds: z.array(z.string()).optional() }).refine(v => Object.keys(v).length > 0);
const departmentSchema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(20), description: z.string().max(500).optional() });
const departmentUpdateSchema = departmentSchema.partial().refine(v => Object.keys(v).length > 0);
const teamSchema = z.object({ name: z.string().trim().min(2).max(100), description: z.string().max(500).optional(), departmentId: z.string().nullable().optional() });
const teamUpdateSchema = teamSchema.partial().refine(v => Object.keys(v).length > 0);
const acceptSchema = z.object({ token: z.string().min(32).max(200) });

const context = (req: Express.Request) => ({ organizationId: req.tenant!.organizationId, actorUserId: req.auth!.userId });

export const updateOrganization: RequestHandler = async (req, res, next) => { try { const v=organizationSchema.parse(req.body); res.json({success:true,data:await workforce.updateOrganization(context(req).organizationId,context(req).actorUserId,v)}); } catch(e){next(e);} };
export const listMembers: RequestHandler = async (req,res,next)=>{try{res.json({success:true,data:await workforce.listMembers(context(req).organizationId)});}catch(e){next(e);}};
export const updateMember: RequestHandler = async(req,res,next)=>{try{const v=memberSchema.parse(req.body);res.json({success:true,data:await workforce.updateMember(context(req).organizationId,context(req).actorUserId,req.params.membershipId,v)});}catch(e){next(e);}};
export const createInvitation: RequestHandler = async(req,res,next)=>{try{const v=invitationSchema.parse(req.body);const result=await workforce.createInvitation(context(req).organizationId,context(req).actorUserId,v);res.status(201).json({success:true,data:result});}catch(e){next(e);}};
export const listInvitations: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await workforce.listInvitations(context(req).organizationId)});}catch(e){next(e);}};
export const revokeInvitation: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await workforce.revokeInvitation(context(req).organizationId,context(req).actorUserId,req.params.invitationId)});}catch(e){next(e);}};
export const acceptInvitation: RequestHandler = async(req,res,next)=>{try{const v=acceptSchema.parse(req.body);res.json({success:true,data:await workforce.acceptInvitation(req.auth!.userId,v.token)});}catch(e){next(e);}};
export const listDepartments: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await workforce.listDepartments(context(req).organizationId)});}catch(e){next(e);}};
export const createDepartment: RequestHandler = async(req,res,next)=>{try{const v=departmentSchema.parse(req.body);res.status(201).json({success:true,data:await workforce.createDepartment(context(req).organizationId,context(req).actorUserId,v)});}catch(e){next(e);}};
export const updateDepartment: RequestHandler = async(req,res,next)=>{try{const v=departmentUpdateSchema.parse(req.body);res.json({success:true,data:await workforce.updateDepartment(context(req).organizationId,context(req).actorUserId,req.params.departmentId,v)});}catch(e){next(e);}};
export const deleteDepartment: RequestHandler = async(req,res,next)=>{try{await workforce.deleteDepartment(context(req).organizationId,context(req).actorUserId,req.params.departmentId);res.status(204).send();}catch(e){next(e);}};
export const listTeams: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await workforce.listTeams(context(req).organizationId)});}catch(e){next(e);}};
export const createTeam: RequestHandler = async(req,res,next)=>{try{const v=teamSchema.parse(req.body);res.status(201).json({success:true,data:await workforce.createTeam(context(req).organizationId,context(req).actorUserId,v)});}catch(e){next(e);}};
export const updateTeam: RequestHandler = async(req,res,next)=>{try{const v=teamUpdateSchema.parse(req.body);res.json({success:true,data:await workforce.updateTeam(context(req).organizationId,context(req).actorUserId,req.params.teamId,v)});}catch(e){next(e);}};
export const deleteTeam: RequestHandler = async(req,res,next)=>{try{await workforce.deleteTeam(context(req).organizationId,context(req).actorUserId,req.params.teamId);res.status(204).send();}catch(e){next(e);}};
export const listAuditEvents: RequestHandler = async(req,res,next)=>{try{const page=Math.max(1,Number(req.query.page)||1);const limit=Math.min(100,Math.max(1,Number(req.query.limit)||25));res.json({success:true,data:await workforce.listAuditEvents(context(req).organizationId,page,limit)});}catch(e){next(e);}};
