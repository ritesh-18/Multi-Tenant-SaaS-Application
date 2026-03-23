# API Testing Guide

This guide is based on the current backend code in `backend/src` and the Docker setup in `docker-compose.yml`.

## 1. What the backend expects

- Base API URL: `http://localhost:5000/api`
- Keycloak URL: `http://localhost:8080`
- Realm: `saas-realm`
- Client ID: `saas-client`
- Most protected APIs require:
  - `Authorization: Bearer <access_token>`
  - `X-Tenant-Slug: <tenant-slug>`

Tenant slugs already seeded by the backend:

- `demo`
- `acme`

## 2. Start the project

Run the containers:

```powershell
docker compose up -d
```

Important services from `docker-compose.yml`:

- PostgreSQL: `5432`
- Redis: `6379`
- Keycloak: `8080`
- Backend: `5000`
- Frontend: `80`
- pgAdmin: `5050`

## 3. Keycloak setup

Open Keycloak admin:

- URL: `http://localhost:8080`
- Username: `admin`
- Password: `admin`

Create the realm:

1. Open the admin console.
2. Create a realm named `saas-realm`.

Create the client:

1. Inside `saas-realm`, create a client named `saas-client`.
2. Keep the client protocol as `openid-connect`.
3. Enable client authentication so you get a client secret.
4. Save the generated client secret.

Set valid redirect URLs:

- `http://localhost:5000/*`
- `http://localhost:5000/api/auth/callback`
- `http://localhost:5173/*`
- `http://localhost/*`

Set valid web origins:

- `http://localhost:5173`
- `http://localhost`
- `http://localhost:5000`

Create test users:

1. Go to `Users`.
2. Create a user with email like `admin@demo.com`.
3. Turn on `Email verified` if needed.
4. Set a password under `Credentials`.
5. Disable temporary password.

Repeat for any extra users you want to test.

## 4. Backend environment values

Your backend container is currently wired like this in `docker-compose.yml`:

```env
KEYCLOAK_BASE_URL=http://keycloak:8080
KEYCLOAK_REALM=saas-realm
KEYCLOAK_CLIENT_ID=saas-client
KEYCLOAK_CLIENT_SECRET=change-me
FRONTEND_URL=http://localhost
```

Important:

- Update `KEYCLOAK_CLIENT_SECRET` in `docker-compose.yml` to the real secret from Keycloak.
- Then restart the backend:

```powershell
docker compose up -d --build backend
```

## 5. First API to test

Health check:

```bash
curl http://localhost:5000/api/health
```

## 6. Login testing

### Password login

Backend route:

- `POST /api/auth/login`

Request body expected by code:

```json
{
  "email": "admin@demo.com",
  "password": "your-password"
}
```

Example:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@demo.com\",\"password\":\"your-password\"}"
```

Expected response:

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 300
}
```

Save the `accessToken` and use it in protected APIs.

### Google login

Backend route:

- `GET /api/auth/google`

This redirects to Keycloak with `kc_idp_hint=google`.

For this to work, you also need to configure Google as an identity provider inside Keycloak. If Google is not configured, use password login for API testing first.

## 7. Refresh token testing

Backend route:

- `POST /api/auth/refresh`

Actual controller expects this body:

```json
{
  "refreshToken": "your-refresh-token"
}
```

Example:

```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"your-refresh-token\"}"
```

## 8. Protected API testing

Most tenant-scoped routes require both the bearer token and tenant header.

Example current tenant call:

```bash
curl http://localhost:5000/api/tenants/current \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example tenant stats:

```bash
curl http://localhost:5000/api/tenants/current/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example users list:

```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example feature flags:

```bash
curl http://localhost:5000/api/feature-flags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example subscriptions:

```bash
curl http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example analytics:

```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

Example audit logs:

```bash
curl http://localhost:5000/api/audit-logs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Tenant-Slug: demo"
```

## 9. Role behavior from code

From the backend middleware:

- A bearer token is required for protected routes.
- Token verification is done using Keycloak realm JWKS.
- For tenant-scoped routes, the backend resolves tenant from:
  - `X-Tenant-Slug`
  - subdomain
  - `req.user.tenant_slug`
  - query param `tenant`

Also important:

- If a Keycloak user logs into a tenant-scoped route and does not already exist in the app database, the backend auto-provisions that user into the resolved tenant.
- The first auto-provisioned user in a tenant becomes `ADMIN`.
- Later auto-provisioned users become `USER`.

## 10. Super admin routes

Some tenant management routes require `SUPER_ADMIN`, for example:

- `GET /api/tenants`
- `POST /api/tenants`
- `DELETE /api/tenants/:id`

So if those return `403`, it is likely your app database user role is not `SUPER_ADMIN`.

## 11. Good Postman setup

Create these collection variables:

- `baseUrl = http://localhost:5000/api`
- `accessToken = <paste after login>`
- `refreshToken = <paste after login>`
- `tenantSlug = demo`

Then reuse them:

- `Authorization: Bearer {{accessToken}}`
- `X-Tenant-Slug: {{tenantSlug}}`

## 12. Current code quirks to know before testing

These are based on the current backend code, not assumptions:

- `POST /api/auth/refresh` expects `refreshToken`, but `swagger.yaml` documents `refresh_token`.
- `AuthController.login()` and `callback()` build the redirect URI as `/auth/callback`, but routes are mounted under `/api/auth/callback`.
- OAuth callback redirects to hardcoded frontend URL `http://localhost:5173/auth/success`.
- Auth cookies are set with `secure: true`, so on plain local HTTP they may not be stored by the browser.
- `POST /api/auth/login` returns raw token fields named `accessToken` and `refreshToken`, while the swagger spec shows a wrapped response shape.

## 13. Recommended first test flow

1. Start Docker services.
2. Create `saas-realm` in Keycloak.
3. Create client `saas-client`.
4. Copy the client secret into `docker-compose.yml`.
5. Restart backend.
6. Create a Keycloak user like `admin@demo.com`.
7. Call `POST /api/auth/login`.
8. Copy `accessToken`.
9. Call `GET /api/tenants/current` with `X-Tenant-Slug: demo`.
10. Call `GET /api/users` with the same token and tenant header.

## 14. Useful routes to test next

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/tenants/current`
- `GET /api/tenants/current/stats`
- `GET /api/users`
- `POST /api/users/invite`
- `GET /api/subscriptions`
- `POST /api/subscriptions/upgrade`
- `GET /api/feature-flags`
- `PUT /api/feature-flags/:key`
- `GET /api/analytics/dashboard`
- `GET /api/audit-logs`

