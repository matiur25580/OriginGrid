export type BillOfMaterialsInput = Array<{ materialId: string; quantity: number; unit: string }>;

export function normalizeCatalogCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeCatalogName(value: string): string {
  return value.trim().toLocaleLowerCase("en");
}

export function validateBillOfMaterials(items: BillOfMaterialsInput): void {
  const seen = new Set<string>();
  for (const item of items) {
    const materialId = item.materialId.trim().toLowerCase();
    if (!materialId) throw new Error("Every bill-of-materials item requires a material identifier");
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error("Bill-of-materials quantities must be positive finite numbers");
    }
    if (!item.unit.trim()) throw new Error("Every bill-of-materials item requires a unit");
    if (seen.has(materialId)) throw new Error("A material may appear only once in a bill of materials");
    seen.add(materialId);
  }
}

export function validateComposition(items: Array<{ substance: string; percentage: number }>): void {
  if (items.some(item =>
    !item.substance.trim() ||
    !Number.isFinite(item.percentage) ||
    item.percentage < 0 ||
    item.percentage > 100
  )) {
    throw new Error("Composition entries require a substance and a percentage between 0 and 100");
  }
  const total = items.reduce((sum, item) => sum + item.percentage, 0);
  if (items.length > 0 && Math.abs(total - 100) > 0.01) {
    throw new Error("Material composition percentages must total 100");
  }
}
