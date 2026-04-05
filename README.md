# ChangeFlow Platform

ChangeFlow Platform is a fullstack construction workflow SaaS focused on one of the highest-friction parts of commercial delivery: managing change orders from intake through review, approval, documentation, and external sync.

The product is designed as an operations command center for project managers, accounting teams, and field leaders. It centralizes project portfolio visibility, document handling, approval workflows, integration health, and auditability in one system.

## What The Project Does

ChangeFlow helps construction teams:

- create and track change orders across active projects
- review commercial impact, approval status, and assignee ownership
- upload and manage supporting documents and attachments with private S3-backed storage
- maintain project team rosters and project-level document vaults
- monitor integration health and manual sync workflows
- archive completed or inactive records without losing traceability
- generate AI-assisted commercial summaries using Claude
- send email-based account and workflow notifications

## Core Features

### Auth And Account Management

- JWT-based authentication with PostgreSQL-backed users
- hashed passwords
- self-service account creation
- forgot-password and reset-password flow
- logged-in account settings and password change
- protected demo account behavior for stable showcase credentials

### Project Portfolio Management

- executive portfolio dashboard
- project creation and editing
- project detail command center
- on-site team management
- project archive flow with read-only enforcement

### Change Order Workflow

- create, edit, and archive change orders
- assignee selection by project team
- approval status transitions
- review comments and activity history
- dedicated change-order details page
- CSV import flow
- pagination, filtering, and search

### File And Document Handling

- S3-backed project document vault
- S3-backed change-order attachments
- presigned upload and download URLs
- document editing and removal
- attachment upload, open, and delete flows

### Integrations And Automation

- integrations center with sync health UI
- webhook intake route
- external sync service structure
- email notification service
- Claude-powered summary generation
- audit log records for important workflow events

## Tech Stack

- Frontend: React, TypeScript, Vite, Material UI
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL + Prisma
- Auth: JWT
- Storage: AWS S3-compatible private uploads with presigned URLs
- AI: Anthropic Claude
- Email: provider-backed email service
- Infra: Docker Compose for local Postgres

## Architecture

```text
changeflow-platform/
├── client/                 # React + TypeScript frontend
├── server/                 # Express + TypeScript API
├── docs/                   # setup, architecture, and API notes
├── docker-compose.yml      # local PostgreSQL
└── package.json            # workspace scripts
```

Key backend areas:

- `server/src/routes` for the HTTP API surface
- `server/src/services` for business logic and integrations
- `server/src/repositories` for database access
- `server/prisma` for schema and seed data

Key frontend areas:

- `client/src/pages` for main product surfaces
- `client/src/components` for reusable UI and modals
- `client/src/api` for typed API wrappers
- `client/src/hooks` for data loading and stateful flows

## Main Product Surfaces

- Public homepage
- Premium login flow
- Dashboard / Operations Center
- Projects portfolio and project details
- Change Orders pipeline and detail workspace
- Integrations Center
- Resources Hub
- Dedicated API Docs page

## Screenshots

### Login and Account Management

![ChangeFlow login page](./Screenshots/Login%20Page.png)

![ChangeFlow account settings](./Screenshots/Account%20Settings.png)

### Operations Center

![ChangeFlow dashboard](./Screenshots/Dashboard.png)

![ChangeFlow system health](./Screenshots/System%20Health.png)

### Projects Portfolio

![ChangeFlow projects overview](./Screenshots/Projects%20Overview.png)

![ChangeFlow projects inventory](./Screenshots/Projects%20Inventory.png)

![ChangeFlow project details](./Screenshots/Project%20In%20Detail.png)

![ChangeFlow project analytics brief](./Screenshots/Project%20Analytics%20Brief.png)

![ChangeFlow project brief quotas](./Screenshots/Project%20Breif%20Quotas.png)

![ChangeFlow team coverage](./Screenshots/Team%20Coverage.png)

### Change Orders Workflow

![ChangeFlow change orders pipeline](./Screenshots/Change%20Orders%20Pipeline.png)

![ChangeFlow create new change order](./Screenshots/Create%20New%20Change%20Order.png)

![ChangeFlow change order details](./Screenshots/Change%20Order%20Details.png)

### Additional Features

![ChangeFlow budget command](./Screenshots/Budget%20Command.png)

![ChangeFlow schedule board](./Screenshots/Schedule%20Board.png)

![ChangeFlow document vault](./Screenshots/Document%20Vault.png)

### API Documentation

![ChangeFlow API docs](./Screenshots/API%20doc%20page.png)

## Demo Credentials

Use the seeded demo account to explore the app quickly:

```text
demo@changeflow.dev / password123
```

Seeded team-member demo account:

```text
elena.park@changeflow.dev / password123
```

Additional seeded users:

- `sarah.mitchell@changeflow.dev`
- `marcus.chen@changeflow.dev`

## Running Locally

From the repo root:

```bash
npm install
cp server/.env.example server/.env
docker compose up -d
npm run prisma:generate --workspace server
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- API Docs page: `http://localhost:5173/api-docs`

If your local demo data ever looks out of sync, reseed:

```bash
npm run prisma:seed --workspace server
```

## Important Docs

- `docs/setup.md` for local environment setup
- `docs/api-setup.md` for optional external API credentials
- `docs/architecture.md` for the system overview

## API Highlights

The app ships with working routes for:

- `auth`
- `projects`
- `project team members`
- `project documents`
- `change orders`
- `change-order comments`
- `change-order attachments`
- `integrations`
- `webhooks`

There is also a dedicated in-app API reference page at:

- `/api-docs`
- `/app/api-docs`

## Optional External Integrations

The local app runs without external providers, but these make it feel closer to production:

- `ANTHROPIC_API_KEY` for Claude summaries
- `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL` for real email delivery
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` for uploads
- `SLACK_WEBHOOK_URL` for Slack alerts
- `PROCORE_*`, `QUICKBOOKS_*`, `NETSUITE_*` for sandbox sync demos

## Why This Is A Strong Portfolio Project

This project is intentionally structured to show more than just CRUD:

- multi-page product design with a polished SaaS UI
- role-aware workflow behavior
- real database-backed state
- secure auth and password flows
- file uploads and private object storage
- AI-assisted workflow enrichment
- integration-oriented backend architecture
- audit logging, webhooks, and sync patterns

## Suggested Resume Description

**ChangeFlow Platform**  
Built a fullstack construction workflow SaaS for managing project portfolios, change orders, approvals, document uploads, and integration health using React, TypeScript, Express, PostgreSQL, Prisma, AWS S3, and Anthropic Claude.

## Current Status

This project is feature-rich and demo-ready. The best remaining work is presentation and deployment polish:

- ✅ improve README visuals with screenshots
- add a few smoke tests
- deploy the app
- optionally connect more external providers
