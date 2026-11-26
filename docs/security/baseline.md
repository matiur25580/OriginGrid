# Security Baseline

## Implemented controls
- Helmet security headers and restricted credentialed CORS.
- JSON and URL-encoded request body limits.
- Environment validation with Zod; access-token secrets must be at least 32 characters.
- Password hashing with bcrypt (cost factor 12).
- Short-lived, issuer/audience-bound HS256 access tokens.
- Opaque refresh tokens stored only as SHA-256 hashes, rotated on refresh, and revoked on logout.
- Refresh-token family revocation when a previously rotated token is reused.
- HttpOnly, SameSite=Strict refresh cookie; Secure is enabled in production.
- Authentication endpoint rate limiting.
- Server-side tenant resolution from a validated organization ID and active membership; never trust a client-supplied role.
- Generic public error responses and redaction of authorization/cookie headers from request logs.

## Required before production
- Email verification, password reset, MFA, session/device management, and account recovery.
- Stronger CSRF/origin policy and deployment-specific cookie domain/path review.
- Centralized secret management and planned JWT key rotation.
- Fine-grained permission policies and audit events for privileged actions.
- Dependency and container scanning, vulnerability remediation, and lockfile-based reproducible installs.
- Explicit production CORS allowlist, backups, restore drills, retention policies, and incident response procedures.
- Security review and integration tests against a production-like MongoDB replica set.

## Data classification
1. Public: explicitly published passport fields.
2. Internal: product operations and non-sensitive organization data.
3. Confidential: supplier contracts, pricing, assessments, and internal evidence.
4. Restricted: credentials, tokens, personal data, and security incident details.

Never expose confidential or restricted data through public passport endpoints.
