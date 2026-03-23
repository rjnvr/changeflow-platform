# Architecture Overview

## Goal

Build a construction change-order platform where project teams can create, review, sync, and audit change orders across internal workflows and external systems.

## Layers

- `client/`: React application for dashboard, project management, change orders, and integrations.
- `server/`: Express API with controllers, services, middleware, validators, and Prisma data access.
- `shared/`: Shared domain types and status constants.
- `docs/`: Architecture and onboarding notes.

## Request flow

1. The client calls Express API routes through lightweight API wrappers.
2. Routes validate input and pass work to controllers.
3. Controllers delegate business logic to services.
4. Services coordinate repositories, integrations, audit logging, and optional AI summaries.
5. Background-style jobs handle CSV imports and notifications.

## Integration flow

1. External system sends a webhook to `webhook.routes.ts`.
2. The webhook controller validates the payload.
3. `externalSync.service.ts` normalizes data into internal change-order records.
4. `auditLog.service.ts` stores an event trail.
5. `slack.service.ts` and `email.service.ts` can notify stakeholders.

## Core entities

- User
- Project
- ChangeOrder
- IntegrationConnection
- AuditLog

## Why this looks production-ready

- Clear separation between controllers, services, validators, and utilities
- Dedicated files for integrations, background jobs, and auditing
- Database schema managed with Prisma
- Shared domain types to keep frontend and backend aligned

