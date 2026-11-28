# Supplier ecosystem

## Scope

The supplier module provides an organization-scoped supplier registry, controlled onboarding lifecycle, multi-tier supplier relationships, supplier contacts and operating sites, risk classifications, and structured assessments.

## Data boundaries

- Every supplier and assessment is scoped by `organizationId`; all reads and writes include the authenticated tenant context.
- Supplier codes and normalized legal names are unique within an organization.
- Parent supplier references must resolve inside the same organization. The service rejects direct self-parenting and a parent assignment that would create a cycle through an immediate child.
- Assessment records are tenant-scoped and reference a supplier in the same tenant.
- Evidence records currently store metadata and a reference string only. Binary uploads, malware scanning, immutable object storage, and retention policies are future integration work; a reference is not proof that a document is authentic.

## Lifecycle

`prospect → onboarding → under_review → approved`

Rejected and suspended suppliers can be returned to onboarding or review through explicit status transitions. Approval is an internal organization decision, not a third-party certification or legal attestation.

## Risk assessments

Assessments contain weighted criteria scored from 0–5. Submission requires criterion weights to total 100; the normalized score is stored from 0–100. An authorized reviewer records findings and a risk classification. This is a decision-support workflow and does not independently validate supplier claims.

## API

All routes require authentication and an active `X-Organization-Id` membership context.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/suppliers` | Tenant member | Filtered, paginated supplier directory |
| POST | `/api/v1/suppliers` | Owner/admin | Register supplier |
| GET | `/api/v1/suppliers/:supplierId` | Tenant member | Supplier profile, tier-2 children, recent assessments |
| PATCH | `/api/v1/suppliers/:supplierId` | Owner/admin | Update supplier profile |
| PATCH | `/api/v1/suppliers/:supplierId/status` | Owner/admin | Transition onboarding status |
| GET/POST | `/api/v1/suppliers/:supplierId/assessments` | Member read / owner-admin write | Assessment history and creation |
| POST | `.../assessments/:assessmentId/submit` | Owner/admin | Submit scored assessment |
| POST | `.../assessments/:assessmentId/review` | Owner/admin | Record reviewer findings and risk level |

All supplier mutations and assessment lifecycle actions create organization audit events. Audit events are append-only through application conventions, not tamper-proof against privileged database operators.
