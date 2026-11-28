import { describe, expect, it } from "vitest";
import {
  normalizeCatalogCode,
  normalizeCatalogName,
  validateBillOfMaterials,
  validateComposition
} from "./catalog.rules.js";

describe("catalog normalization", () => {
  it("normalizes catalog codes consistently", () => {
    expect(normalizeCatalogCode("  ab-12  ")).toBe("AB-12");
  });

  it("normalizes names without changing internal spacing", () => {
    expect(normalizeCatalogName("  Recycled Polymer ")).toBe("recycled polymer");
  });
});

describe("bill of materials validation", () => {
  it("accepts unique materials with positive finite quantities", () => {
    expect(() => validateBillOfMaterials([
      { materialId: "65a000000000000000000001", quantity: 2, unit: "kg" },
      { materialId: "65a000000000000000000002", quantity: 0.25, unit: "litre" }
    ])).not.toThrow();
  });

  it("rejects duplicate material identifiers case-insensitively", () => {
    expect(() => validateBillOfMaterials([
      { materialId: "65A000000000000000000001", quantity: 1, unit: "kg" },
      { materialId: "65a000000000000000000001", quantity: 2, unit: "kg" }
    ])).toThrow(/only once/);
  });

  it("rejects blank material identifiers and units", () => {
    expect(() => validateBillOfMaterials([{ materialId: " ", quantity: 1, unit: "kg" }])).toThrow(/identifier/);
    expect(() => validateBillOfMaterials([{ materialId: "65a000000000000000000001", quantity: 1, unit: " " }])).toThrow(/unit/);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects invalid quantity %s",
    quantity => {
      expect(() => validateBillOfMaterials([
        { materialId: "65a000000000000000000001", quantity, unit: "kg" }
      ])).toThrow(/positive finite/);
    }
  );

  it("allows an empty bill of materials for products without component breakdowns", () => {
    expect(() => validateBillOfMaterials([])).not.toThrow();
  });
});

describe("material composition validation", () => {
  it("accepts composition totals within the documented rounding tolerance", () => {
    expect(() => validateComposition([
      { substance: "Polymer", percentage: 70 },
      { substance: "Additive", percentage: 29.995 }
    ])).not.toThrow();
  });

  it("rejects composition totals outside the rounding tolerance", () => {
    expect(() => validateComposition([
      { substance: "Polymer", percentage: 80 },
      { substance: "Additive", percentage: 19 }
    ])).toThrow(/total 100/);
  });

  it("rejects blank substances, non-finite values and percentages outside 0–100", () => {
    expect(() => validateComposition([{ substance: " ", percentage: 100 }])).toThrow(/substance/);
    expect(() => validateComposition([{ substance: "Polymer", percentage: Number.NaN }])).toThrow(/percentage/);
    expect(() => validateComposition([{ substance: "Polymer", percentage: 101 }])).toThrow(/percentage/);
    expect(() => validateComposition([{ substance: "Polymer", percentage: -1 }])).toThrow(/percentage/);
  });

  it("allows an empty composition when no composition data is supplied", () => {
    expect(() => validateComposition([])).not.toThrow();
  });
});
