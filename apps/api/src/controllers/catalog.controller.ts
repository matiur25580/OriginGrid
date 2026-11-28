import type { Request, RequestHandler } from "express";
import { z } from "zod";
import * as catalog from "../services/catalog.service.js";
const bomItem = z.object({ materialId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().finite().positive().max(1_000_000_000), unit: z.string().trim().min(1).max(30) });
const productSchema = z.object({
 sku: z.string().trim().min(2).max(48).regex(/^[a-zA-Z0-9._-]+$/), name: z.string().trim().min(2).max(180), category: z.string().trim().min(1).max(80),
 description: z.string().max(3000).optional(), productType: z.enum(["finished_good", "component"]).optional(), brand: z.string().max(120).optional(),
 modelNumber: z.string().max(80).optional(), gtin: z.string().regex(/^\d{8,14}$/).nullable().optional(), originCountryCode: z.string().length(2).nullable().optional(),
 status: z.enum(["draft", "active", "retired"]).optional(), billOfMaterials: z.array(bomItem).max(500).optional()
});
const compositionItem = z.object({ substance: z.string().trim().min(1).max(120), percentage: z.number().finite().min(0).max(100) });
const materialSchema = z.object({
 materialCode: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/), name: z.string().trim().min(2).max(160),
 category: z.string().trim().min(1).max(80), unitOfMeasure: z.string().trim().min(1).max(30), description: z.string().max(2000).optional(),
 countryOfOrigin: z.string().length(2).nullable().optional(), supplierId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
 composition: z.array(compositionItem).max(100).optional(), recycledContentPercent: z.number().finite().min(0).max(100).optional(),
 status: z.enum(["draft", "active", "discontinued"]).optional()
});
const updateProductSchema = productSchema.partial().refine(value => Object.keys(value).length > 0);
const updateMaterialSchema = materialSchema.partial().refine(value => Object.keys(value).length > 0);
const routeId = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const actor = (req: Express.Request) => ({ organizationId: req.tenant!.organizationId, userId: req.auth!.userId });
function filters(req: Request) {
 const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
 const search = typeof req.query.search === "string" ? req.query.search.slice(0, 100) : undefined;
 const status = typeof req.query.status === "string" ? req.query.status : undefined;
 const category = typeof req.query.category === "string" ? req.query.category.slice(0, 80) : undefined;
 return { page, limit, ...(search !== undefined ? { search } : {}), ...(status !== undefined ? { status } : {}), ...(category !== undefined ? { category } : {}) };
}
export const listProducts: RequestHandler = async (req,res,next)=>{try{res.json({success:true,data:await catalog.listProducts(actor(req).organizationId,filters(req))});}catch(error){next(error);}};
export const createProduct: RequestHandler = async (req,res,next)=>{try{const input=productSchema.parse(req.body);res.status(201).json({success:true,data:await catalog.createProduct(actor(req),input)});}catch(error){next(error);}};
export const getProduct: RequestHandler = async (req,res,next)=>{try{res.json({success:true,data:await catalog.getProduct(actor(req).organizationId,routeId(req.params.productId))});}catch(error){next(error);}};
export const updateProduct: RequestHandler = async (req,res,next)=>{try{const input=updateProductSchema.parse(req.body);res.json({success:true,data:await catalog.updateProduct(actor(req),routeId(req.params.productId),input)});}catch(error){next(error);}};
export const listMaterials: RequestHandler = async (req,res,next)=>{try{res.json({success:true,data:await catalog.listMaterials(actor(req).organizationId,filters(req))});}catch(error){next(error);}};
export const createMaterial: RequestHandler = async (req,res,next)=>{try{const input=materialSchema.parse(req.body);res.status(201).json({success:true,data:await catalog.createMaterial(actor(req),input)});}catch(error){next(error);}};
export const getMaterial: RequestHandler = async (req,res,next)=>{try{res.json({success:true,data:await catalog.getMaterial(actor(req).organizationId,routeId(req.params.materialId))});}catch(error){next(error);}};
export const updateMaterial: RequestHandler = async (req,res,next)=>{try{const input=updateMaterialSchema.parse(req.body);res.json({success:true,data:await catalog.updateMaterial(actor(req),routeId(req.params.materialId),input)});}catch(error){next(error);}};
