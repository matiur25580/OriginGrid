# Catalog integrity and validation

OriginGrid's catalog rules are intentionally deterministic and independent of persistence. The API validates request shapes at the route boundary, then the catalog service validates tenant-owned references before writing product and material records.

## Bill of materials

- Quantities must be finite and greater than zero.
- Units and material identifiers are required.
- A material may occur only once in a bill of materials. Identifier comparison is case-insensitive so equivalent MongoDB ObjectId strings cannot bypass duplicate detection.
- Every referenced material must be active and belong to the same organization before a product is created or updated.
- Empty bills of materials are valid for products that do not declare component breakdowns.

## Material composition

- Every substance needs a non-empty name.
- Percentages must be finite and between 0 and 100.
- A non-empty composition must total 100%, allowing a maximum absolute rounding difference of 0.01 percentage points.
- Empty composition is permitted when composition data is not available.

## Verification

Run the workspace checks from the repository root:

```bash
npm run typecheck
npm test
npm run build
```

The catalog rules tests cover normalization, duplicate identifiers, invalid quantities, missing identifiers and units, composition totals, boundary values, and empty optional collections.

These deterministic unit tests complement, but do not replace, database-backed integration tests for tenant isolation, authorization, unique indexes, and audit persistence.
