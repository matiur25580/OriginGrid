# Security Baseline

## Implemented controls
- Helmet security headers, restricted credentialed CORS, and bounded request bodies.
- Zod environment and request validation.
- bcrypt password hashing, short-lived issuer/audience-bound JWT access tokens, and hashed opaque refresh tokens.
- Refresh rotation with reuse-family revocation; HttpOnly, SameSite=Strict refresh cookie.
- Authentication endpoint rate limiting and active-account checks.
- Server-side tenant resolution from active membership; client-supplied roles are never trusted.
- Role-protected organization administration routes.
- Invitation tokens are high-entropy, stored only as SHA-256 hashes, email-bound, expiring, and revocable.
- Tenant-scoped department/team references are validated before assignment.
- Organization workforce actions create audit events; audit data excludes passwords, tokens, and invitation secrets.
- Authorization and cookie headers are redacted from request logs.

## Required before production
- Transactional email delivery, email verification, password reset, MFA, session/device management, and account recovery.
- Stronger CSRF/origin policy and deployment-specific cookie domain/path review.
- Centralized secret management and planned JWT key rotation.
- Fine-grained permission policies, ownership transfer, audit retention/export, and stronger audit tamper-resistance.
- Dependency/container scanning, vulnerability remediation, and lockfile-based reproducible installs.
- Explicit production CORS allowlist, backups, restore drills, retention policies, and incident response procedures.
- Integration tests against a production-like MongoDB replica set and independent security review.

## Data classification
1. Public: explicitly published passport fields.
2. Internal: product operations and non-sensitive organization data.
3. Confidential: supplier contracts, pricing, assessments, and internal evidence.
4. Restricted: credentials, tokens, personal data, and security incident details.

Never expose confidential or restricted data through public passport endpoints.
