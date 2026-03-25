# ChangeFlow Platform

A student-friendly fullstack starter for a construction workflow SaaS focused on change orders, external integrations, audit trails, and automation.

## Tech stack

- Frontend: React, TypeScript, Vite, Material UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Auth: JWT
- Integrations: Slack webhook, email, mock external sync
- AI add-on: Anthropic Claude summary generation with local fallback

## Project structure

```text
changeflow-platform/
├── client/
├── server/
├── shared/
├── docs/
├── docker-compose.yml
└── package.json
```

## Highlights

- Project and change-order focused API surface
- Integration-friendly backend modules like `externalSync.service.ts`
- Webhook entry point for external systems
- CSV import job scaffold for ETL-style workflows
- Audit logging service for traceability
- Material UI frontend shell with dashboard, projects, and integrations pages
- Secure local auth flow with hashed passwords, self-service access requests, and password reset

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Postgres:

   ```bash
   docker compose up -d
   ```

3. Set environment variables for the server:

   ```bash
   cp server/.env.example server/.env
   ```

4. Generate Prisma client and run migrations:

   ```bash
   npm run prisma:generate --workspace server
   npm run prisma:migrate --workspace server
   npm run prisma:seed --workspace server
   ```

5. Run the apps:

   ```bash
   npm run dev
   ```

6. Sign in with the seeded demo account:

   ```text
   demo@changeflow.dev / password123
   ```

## Auth flows

- `Log In` works against hashed local user records in Postgres.
- `Request Platform Access` creates a new local account and signs the user in immediately.
- `Forgot Password` sends a real reset email when `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, and `APP_BASE_URL` are configured.
- If email is not configured, the reset flow automatically falls back to local preview mode and exposes the reset token in the UI for development.
- New account signups and change-order status updates also use the same email delivery service.

## Suggested next steps

- Replace stubbed repository logic with live Prisma queries everywhere
- Add BullMQ for background job processing
- Connect Slack, email, and Anthropic Claude credentials
- Add tests and GitHub Actions CI
