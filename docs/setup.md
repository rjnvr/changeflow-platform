# Local Setup

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop

## First run

1. Run `npm install` from the repo root.
2. Start PostgreSQL with `docker compose up -d`.
3. Copy `server/.env.example` to `server/.env`.
4. Run `npm run prisma:generate --workspace server`.
5. Run `npm run prisma:migrate --workspace server`.
6. Run `npm run prisma:seed --workspace server`.
7. Start the frontend and backend with `npm run dev`.

## Demo flow

1. Open `http://localhost:5173`.
2. Sign in with `demo@changeflow.dev` and `password123`.
3. Visit the projects, change orders, and integrations pages.
4. Trigger the sample integration sync from the integrations screen.
