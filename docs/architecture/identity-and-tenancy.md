# Identity, Tenant, and Workforce Architecture

## Identity
- A user is a global identity with a normalized unique email address.
- Passwords are hashed with bcrypt; plaintext passwords are never persisted.
- Access tokens are short-lived JWTs (15 minutes), signed with HS256 and constrained by issuer and audience.
- Refresh credentials are random opaque values. Only SHA-256 hashes are stored in MongoDB.
- Refresh rotation revokes the prior token and stores its replacement hash. Reuse of a revoked token revokes all still-active tokens in that family.
- The refresh credential is transported in an HttpOnly, SameSite=Strict cookie. The access token is returned in the response body and should be kept in memory by the browser client.

## Organization tenancy
- Organizations are independent tenant boundaries.
- Membership is a separate relationship between users and organizations, with roles: owner, admin, member, viewer.
- Registration creates the first organization and grants its creator the owner role.
- Tenant-scoped API routes require a valid bearer access token and an `X-Organization-Id` header.
- The server resolves organization membership from the authenticated user ID. Client-provided roles are ignored.
- Every tenant-owned query must include the resolved `req.tenant.organizationId`.

## Workforce
- Membership records can be assigned to one department and multiple teams within the same organization.
- Invitations are email-bound, expire after seven days, and store only a SHA-256 token hash.
- Invitation acceptance requires an authenticated account whose normalized email matches the invitation.
- Invitation tokens are returned once to the authorized inviter so they can share the link through an approved channel. No email provider is wired in this milestone; production deployments must integrate a verified transactional email provider and avoid exposing tokens in application logs.
- Owner membership is protected from ordinary role/status edits. Ownership transfer is a separate future workflow.
- Departments cannot be deleted while they still contain teams; membership references are cleared when a department is deleted.
- Team and department identifiers are checked against the active tenant before assignment.
- Organization audit events capture workforce and organization administration actions. Audit records are append-only at the application layer, not tamper-proof against privileged database operators.

## API surface
- Auth: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- Tenant context: `GET /api/v1/organizations/context`.
- Organization settings: `PATCH /api/v1/organizations/settings`.
- Members: `GET /api/v1/organizations/members`, `PATCH /api/v1/organizations/members/:membershipId`.
- Invitations: `POST /api/v1/organizations/invitations`, `GET /api/v1/organizations/invitations`, `DELETE /api/v1/organizations/invitations/:invitationId`, `POST /api/v1/organizations/invitations/accept`.
- Departments: `GET/POST /api/v1/organizations/departments`, `PATCH/DELETE /api/v1/organizations/departments/:departmentId`.
- Teams: `GET/POST /api/v1/organizations/teams`, `PATCH/DELETE /api/v1/organizations/teams/:teamId`.
- Audit: `GET /api/v1/organizations/audit-events?page=1&limit=25`.

## Deliberate follow-up work
Email verification, password reset, MFA, invitation email delivery, ownership transfer, fine-grained custom permissions, audit retention/export, and production security integration tests remain follow-up work.
