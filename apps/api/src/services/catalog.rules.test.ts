import { describe, expect, it } from "vitest";
import { normalizeCatalogCode, normalizeCatalogName, validateBillOfMaterials, validateComposition } from "./catalog.rules.js";
describe("catalog rules", () => {
 it("normalizes organization catalog identifiers", () => { expect(normalizeCatalogCode("  ab-12 ")).toBe("AB-12"); expect(normalizeCatalogName("  Recycled Polymer ")).toBe("recycled polymer"); });
 it("accepts a unique positive bill of materials", () => { expect(() => validateBillOfMaterials([{ materialId: "mat-1", quantity: 2, unit: "kg" }])).not.toThrow(); });
 it("rejects duplicate materials and non-positive quantities", () => {
  expect(() => validateBillOfMaterials([{ materialId: "mat-1", quantity: 1, unit: "kg" }, { materialId: "mat-1", quantity: 2, unit: "kg" }])).toThrow(/only once/);
  expect(() => validateBillOfMaterials([{ materialId: "mat-2", quantity: 0, unit: "kg" }])).toThrow(/positive/);
 });
 it("requires material composition to total 100 percent", () => {
  expect(() => validateComposition([{ substance: "Polymer", percentage: 80 }])).toThrow(/total 100/);
  expect(() => validateComposition([{ substance: "Polymer", percentage: 70 }, { substance: "Additive", percentage: 30 }])).not.toThrow();
 });
});
