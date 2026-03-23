# ChangeFlow Platform

A student-friendly fullstack starter for a construction workflow SaaS focused on change orders, external integrations, audit trails, and automation.

## Tech stack

- Frontend: React, TypeScript, Vite, Material UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL with Prisma
- Auth: JWT
- Integrations: Slack webhook, email, mock external sync
- AI add-on: OpenAI summary generation hook point

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

## Suggested next steps

- Replace stubbed repository logic with live Prisma queries everywhere
- Add BullMQ for background job processing
- Connect Slack, email, and OpenAI credentials
- Add tests and GitHub Actions CI
