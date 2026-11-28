# Product and material registry

## Scope
Milestone 5 introduces tenant-scoped product and material master records and an initial bill-of-materials (BOM) relationship. It establishes stable organization-scoped SKUs and material codes for later provenance, genealogy, and Digital Product Passport workflows.

## Data model
- Products have an organization-scoped SKU, category, product type, optional GTIN/model/brand/origin, lifecycle status, and BOM.
- Materials have an organization-scoped material code, category, unit of measure, optional origin/supplier, composition, recycled-content percentage, and lifecycle status.
- BOM lines reference active materials in the same organization and require positive quantities and units. A material can appear only once per BOM.
- Material composition entries, when supplied, must total 100 percent (within 0.01 percentage points).

## Tenant and authorization boundaries
- All reads and writes require authenticated membership plus active organization context.
- Tenant scope is derived exclusively from authenticated tenant middleware; body/query organization identifiers are not accepted.
- Product and material writes require owner/admin roles. Tenant members can read records.
- Supplier references and BOM material references are checked against the same organization.
- Unique indexes scope SKU, GTIN, and material code by organization.

## API
All routes are under the configured API prefix and require Authorization Bearer token plus X-Organization-Id.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET/POST | /catalog/products | Member / owner-admin | Product directory and creation |
| GET/PATCH | /catalog/products/:productId | Member / owner-admin | Product detail and update |
| GET/POST | /catalog/materials | Member / owner-admin | Material directory and creation |
| GET/PATCH | /catalog/materials/:materialId | Member / owner-admin | Material detail and update |

List endpoints support page, limit, search, status, and category. Pagination is bounded to 100 records per page.

## Integrity and limitations
BOM references and supplier ownership are validated at write time; unique indexes remain the concurrency-safe duplicate guard. Audit events are application-level append-only conventions and are not tamper-proof against privileged database operators. This milestone does not yet implement batch inventory, procurement, lifecycle events, public passports, evidence uploads, or a connected production frontend.
