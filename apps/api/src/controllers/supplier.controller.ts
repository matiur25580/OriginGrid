import type { RequestHandler } from "express";
import { z } from "zod";
import * as suppliers from "../services/supplier.service.js";

const contact = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().email().max(254), role: z.string().max(100).optional(), phone: z.string().max(40).optional(), isPrimary: z.boolean().optional() });
const site = z.object({ name: z.string().trim().min(1).max(120), addressLine1: z.string().trim().min(1).max(200), addressLine2: z.string().max(200).optional(), city: z.string().trim().min(1).max(100), region: z.string().max(100).optional(), postalCode: z.string().max(24).optional(), countryCode: z.string().length(2), siteType: z.enum(["headquarters","manufacturing","warehouse","office","other"]).optional() });
const supplierSchema = z.object({
  legalName: z.string().trim().min(2).max(180), displayName: z.string().trim().min(2).max(140),
  supplierCode: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/), description: z.string().max(2000).optional(),
  website: z.string().url().max(300).optional(), countryCode: z.string().length(2),
  categories: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  capabilities: z.array(z.string().trim().min(1).max(100)).max(50).default([]),
  contacts: z.array(contact).max(50).default([]), sites: z.array(site).max(100).default([]),
  parentSupplierId: z.string().nullable().optional()
});
const updateSchema = supplierSchema.partial().refine(v => Object.keys(v).length > 0);
const statusSchema = z.object({ status: z.enum(["prospect","onboarding","under_review","approved","rejected","suspended"]), reason: z.string().max(1000).optional() });
const criterion = z.object({ key: z.string().trim().min(1).max(60), label: z.string().trim().min(1).max(120), score: z.number().min(0).max(5), weight: z.number().min(0).max(100), notes: z.string().max(1000).optional() });
const evidence = z.object({ title: z.string().trim().min(1).max(160), reference: z.string().trim().min(1).max(500), evidenceType: z.enum(["certificate","policy","audit_report","questionnaire","other"]).optional(), expiresAt: z.string().datetime().optional() });
const assessmentSchema = z.object({ title: z.string().trim().min(2).max(160), assessmentType: z.enum(["security","quality","sustainability","compliance","financial","general"]).default("general"), criteria: z.array(criterion).max(30).default([]), evidence: z.array(evidence).max(100).default([]) });
const reviewSchema = z.object({ findings: z.string().max(4000), riskLevel: z.enum(["low","medium","high","critical"]) });
const routeId = (v: string | string[] | undefined) => typeof v === "string" ? v : "";
const actor = (req: Express.Request) => ({ organizationId: req.tenant!.organizationId, userId: req.auth!.userId });

export const list: RequestHandler = async (req,res,next)=>{try{
 const page=Math.max(1,Number(req.query.page)||1), limit=Math.min(100,Math.max(1,Number(req.query.limit)||25));
 const status=typeof req.query.status==="string"?req.query.status:undefined, riskLevel=typeof req.query.riskLevel==="string"?req.query.riskLevel:undefined, search=typeof req.query.search==="string"?req.query.search.slice(0,100):undefined;
 res.json({success:true,data:await suppliers.listSuppliers(actor(req).organizationId,{page,limit,status,riskLevel,search})});
}catch(e){next(e);}};
export const create: RequestHandler = async(req,res,next)=>{try{const v=supplierSchema.parse(req.body);res.status(201).json({success:true,data:await suppliers.createSupplier(actor(req),v)});}catch(e){next(e);}};
export const get: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await suppliers.getSupplier(actor(req).organizationId,routeId(req.params.supplierId))});}catch(e){next(e);}};
export const update: RequestHandler = async(req,res,next)=>{try{const v=updateSchema.parse(req.body);res.json({success:true,data:await suppliers.updateSupplier(actor(req),routeId(req.params.supplierId),v)});}catch(e){next(e);}};
export const changeStatus: RequestHandler = async(req,res,next)=>{try{const v=statusSchema.parse(req.body);res.json({success:true,data:await suppliers.changeSupplierStatus(actor(req),routeId(req.params.supplierId),v.status,v.reason)});}catch(e){next(e);}};
export const assessments: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await suppliers.listAssessments(actor(req).organizationId,routeId(req.params.supplierId))});}catch(e){next(e);}};
export const createAssessment: RequestHandler = async(req,res,next)=>{try{const v=assessmentSchema.parse(req.body);res.status(201).json({success:true,data:await suppliers.createAssessment(actor(req),routeId(req.params.supplierId),v)});}catch(e){next(e);}};
export const submitAssessment: RequestHandler = async(req,res,next)=>{try{res.json({success:true,data:await suppliers.submitAssessment(actor(req),routeId(req.params.supplierId),routeId(req.params.assessmentId))});}catch(e){next(e);}};
export const reviewAssessment: RequestHandler = async(req,res,next)=>{try{const v=reviewSchema.parse(req.body);res.json({success:true,data:await suppliers.reviewAssessment(actor(req),routeId(req.params.supplierId),routeId(req.params.assessmentId),v.findings,v.riskLevel)});}catch(e){next(e);}};
