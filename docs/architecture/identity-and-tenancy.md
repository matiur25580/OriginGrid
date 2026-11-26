# Identity and Tenant Architecture

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
- The server resolves the organization membership from the authenticated user ID. Client-provided roles are ignored.
- Every future tenant-owned query must include the resolved `req.tenant.organizationId`; do not accept tenant IDs from request bodies as an authorization decision.

## API surface
- `POST /api/v1/auth/register`: create a user, organization, owner membership, and session.
- `POST /api/v1/auth/login`: authenticate credentials and issue a session.
- `POST /api/v1/auth/refresh`: rotate the refresh cookie and issue a new access token.
- `POST /api/v1/auth/logout`: revoke the current refresh token and clear its cookie.
- `GET /api/v1/auth/me`: return the authenticated profile and active organizations.
- `GET /api/v1/organizations/context`: resolve the current organization context and membership role.

## Deliberate follow-up work
Email verification, password reset, MFA, invitation workflows, organization administration, fine-grained permissions, and durable audit events are not represented as complete in this milestone.
