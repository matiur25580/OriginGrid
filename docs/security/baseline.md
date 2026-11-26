# Security Baseline

## Current foundation controls
- Helmet security headers.
- CORS restricted to the configured web origin.
- JSON request body limit.
- Environment validation with Zod.
- Generic public error responses.
- Server-side HTTP request logging.
- No credentials committed to the repository.

## Required before production
- Authentication with secure password hashing and refresh-token rotation.
- Server-side tenant and membership authorization on every tenant-scoped operation.
- Rate limiting and brute-force protections.
- CSRF protections if cookie-based authentication is used.
- Strict input validation and output DTO allowlists.
- Secret management through deployment environment or a secret manager.
- Redaction of authorization headers, cookies, tokens, and sensitive payload fields from logs.
- Dependency and container scanning.
- Explicit production CORS allowlist.
- Backups, restore drills, retention policies, and incident response procedures.
- Audit events for privileged and sensitive actions.

## Data classification
1. Public: explicitly published passport fields.
2. Internal: product operations and non-sensitive organization data.
3. Confidential: supplier contracts, pricing, assessments, and internal evidence.
4. Restricted: credentials, tokens, personal data, and security incident details.

Never expose confidential or restricted data through public passport endpoints.