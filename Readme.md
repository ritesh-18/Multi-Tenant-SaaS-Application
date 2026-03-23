# Multi-Tenant SaaS Application

This project is a multi-tenant SaaS platform with:

- a React frontend
- a Node.js + Express backend
- PostgreSQL for data storage
- Redis for caching and queues
- Keycloak for authentication
- pgAdmin for database inspection

The app is designed to support multiple companies or workspaces in a single system while keeping tenant data isolated.

## Benefits Of This App

- Multi-tenant architecture: one platform can serve many organizations with tenant-based isolation
- Centralized authentication: Keycloak handles login, tokens, and identity flows
- Role-based access control: supports `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `USER`
- Tenant-aware feature delivery: feature flags and plan-based capabilities can vary by tenant
- Usage visibility: analytics and audit logs help track platform activity
- Scalable backend setup: Redis caching and queues improve performance and background processing
- Docker-based local setup: easier onboarding with a single compose workflow

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Auth: Keycloak
- Database: PostgreSQL
- Cache / queues: Redis, BullMQ
- Admin tooling: pgAdmin
- Containerization: Docker Compose

## Project Structure

```text
backend/                    Express API and business logic
frontend/keycloak-frontend/ React frontend
postgres/                   Database bootstrap SQL
docker-compose.yml          Full local development stack
apitesting.md               API + Keycloak testing notes
```

## Run With Docker

### 1. Start all services

From the project root:

```powershell
docker compose up -d --build
```

This starts:

- Frontend at `http://localhost`
- Backend at `http://localhost:5000`
- Keycloak at `http://localhost:8080`
- pgAdmin at `http://localhost:5050`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`

### 2. Run database migrations

After containers are up, run:

```powershell
docker compose exec backend npm run db:migrate
```

### 3. Seed demo data

To create default tenants such as `demo` and `acme`, run:

```powershell
docker compose exec backend npm run db:seed
```

This is important because tenant-scoped login flows expect tenant records to already exist.

## Keycloak Setup

Open Keycloak:

- URL: `http://localhost:8080`
- Username: `admin`
- Password: `admin`

Create the following:

### Realm

- Create a realm named `saas-realm`

### Client

- Create a client named `saas-client`
- Protocol: `openid-connect`
- Enable client authentication
- Enable direct access grants
- Copy the client secret

### Redirect URLs

Add these valid redirect URLs:

- `http://localhost:5000/*`
- `http://localhost:5000/api/auth/callback`
- `http://localhost:5173/*`
- `http://localhost/*`

Add these web origins:

- `http://localhost`
- `http://localhost:5000`
- `http://localhost:5173`

### Users

Create a test user, for example:

- email: `admin@demo.com`
- password: `admin`

## Backend Configuration Note

The backend uses these Keycloak-related environment variables from `docker-compose.yml`:

- `KEYCLOAK_BASE_URL`
- `KEYCLOAK_REALM`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`

Before sharing or deploying the project, make sure `KEYCLOAK_CLIENT_SECRET` is set to the real client secret for your Keycloak client.

## Default Test Tenant

After seeding, you can use:

- tenant slug: `demo`

This is useful in the frontend login form where the workspace / tenant slug is required.

## Useful Docker Commands

Start services:

```powershell
docker compose up -d
```

Rebuild services:

```powershell
docker compose up -d --build
```

View logs:

```powershell
docker compose logs -f
```

View backend logs only:

```powershell
docker compose logs -f backend
```

Stop services:

```powershell
docker compose down
```

Stop services and remove volumes:

```powershell
docker compose down -v
```

## Available URLs

- Frontend: `http://localhost`
- Backend API: `http://localhost:5000/api`
- Keycloak: `http://localhost:8080`
- pgAdmin: `http://localhost:5050`

## Key API Notes

- Protected routes use `Authorization: Bearer <token>`
- Tenant-aware routes also require `X-Tenant-Slug`
- The backend auto-provisions users during tenant-aware requests
- If `demo` is missing, run the seed command again

## API Testing

For more detailed API and authentication testing instructions, see:

- [apitesting.md](/c:/Users/ritsm/OneDrive/Desktop/Vibe%20Coding/Multi-Tenant-SaaS-Application/apitesting.md)

