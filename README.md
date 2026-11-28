# OriginGrid

**Every Product Has a Story. Every Story Has Proof.**

OriginGrid is an enterprise product provenance and Digital Product Passport platform. It is designed to help manufacturers, suppliers, distributors, and compliance teams maintain an evidence-backed view of a product's lifecycle—from raw-material sourcing and manufacturing through distribution, repair, and end-of-life processing.

> **Project status:** Milestones 1–2 completed in draft pull requests; Milestone 3 workforce management in development. Features are not production-ready until fully tested, reviewed, and deployed. This repository is an evolving software project; features are not production-ready until implemented, tested, documented, and deployed.

## Product goals

- Give products and batches durable digital identities.
- Connect suppliers, materials, components, manufacturing events, and finished products.
- Maintain traceable, attributable lifecycle events.
- Publish carefully scoped Digital Product Passport information.
- Support supplier, quality, compliance, sustainability, and recall workflows.
- Provide tenant-isolated workspaces for independent organizations.

## Planned capabilities

1. Enterprise identity, organizations, membership, and role-based access.
2. Supplier onboarding, verification, and multi-tier relationships.
3. Product, material, component, and bill-of-materials registry.
4. Provenance event ledger and product genealogy.
5. Digital Product Passports with QR-based public views.
6. Compliance obligations, certifications, and evidence management.
7. Sustainability metrics and product-level environmental reporting.
8. Quality inspections, non-conformance, and recall investigations.
9. Risk intelligence, analytics, notifications, and integrations.

## Technology direction

- **Frontend:** React, TypeScript, Vite, Tailwind CSS.
- **Backend:** Node.js, Express, TypeScript.
- **Data:** MongoDB and Mongoose.
- **Async / real-time:** Redis, BullMQ, Socket.IO (introduced when needed).
- **Quality:** Vitest/Jest, Supertest, Playwright, ESLint, Prettier.
- **Delivery:** Docker and GitHub Actions.

The initial implementation uses a modular-monolith architecture. Module boundaries and contracts will be kept explicit so independently scaling services can be extracted later when justified by operational needs.

## Repository layout

```text
OriginGrid/
├── apps/
│   ├── api/          # Express API
│   └── web/          # React application
├── docs/
│   ├── architecture/ # Architecture decisions and diagrams
│   └── security/     # Security model and operational guidance
├── .github/workflows/
└── docker-compose.yml
```

## Local development

Prerequisites: Node.js 22+, npm 10+, Docker Desktop, and Git.

The application setup instructions will be maintained here as the foundation is implemented. Never commit real credentials. Copy the relevant `.env.example` file and provide local values.

## Engineering principles

- Tenant isolation is enforced server-side, not by trusting client-supplied organization IDs.
- Validate untrusted input at API boundaries.
- Keep secrets out of source control and logs.
- Treat provenance history as append-only at the application layer; privileged database operators remain part of the threat model.
- Separate public passport fields from private enterprise records.
- Make consequential compliance and risk decisions reviewable by authorized humans.
- Back features with tests, API documentation, and auditable workflows.

## Project roadmap

| Milestone | Scope |
|---|---|
| M1 | Enterprise foundation and architecture |
| M2 | Authentication and multi-tenancy |
| M3 | Organization, workforce, and RBAC (in progress) |
| M4 | Supplier ecosystem |
| M5 | Product and material registry |
| M6 | Provenance and traceability |
| M7 | Digital Product Passport |
| M8 | Compliance and certification |
| M9 | Sustainability intelligence |
| M10 | Quality and recall management |
| M11 | AI intelligence and analytics |
| M12 | Integrations, hardening, and release |

## Contributing

Changes should be delivered in focused branches and pull requests. Include tests for behavior changes, update documentation, and describe security or data-model implications.

## License

A license will be selected and added before public redistribution. Until then, no open-source license is granted by this repository.
