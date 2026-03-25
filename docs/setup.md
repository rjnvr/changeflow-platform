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

## Local auth flow

- Use the seeded demo login above if you just want to enter the app quickly.
- Use `Request Platform Access` on the login screen to create a new local account.
- Use `Forgot Password` to generate a reset token locally and set a new password when email is not configured.
- Once `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, and `APP_BASE_URL` are configured, the reset flow sends a live email that deep-links back into the reset modal.

## Optional API setup for the full version

You do not need extra APIs to run the current local demo. You only need them when upgrading this into a fuller product.

- `ANTHROPIC_API_KEY` and optionally `ANTHROPIC_MODEL` for Claude-generated summaries and review assistance
- `SLACK_WEBHOOK_URL` for real Slack notifications
- `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`, and `APP_BASE_URL` for invites, reset password, and alerts
- `S3_*` credentials for document uploads and project files
- `GOOGLE_*` and `MICROSOFT_*` credentials for real SSO
- `PROCORE_*`, `QUICKBOOKS_*`, or `NETSUITE_*` credentials for real sync demos

## S3 upload note

Browser uploads also need S3 bucket CORS for `http://localhost:5173`.

Use this CORS configuration in the bucket if uploads fail from the UI:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

See [api-setup.md](/Users/arjun/Documents/Code/changeflow-platform/docs/api-setup.md) for the full list and the feature each API unlocks.
