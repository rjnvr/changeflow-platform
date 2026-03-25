# API Setup Guide

This project already runs locally with PostgreSQL and seeded demo data. The APIs below are only needed when you want to upgrade it from a polished demo into a fuller product.

## Recommended first setup

These are the highest-value APIs to connect first:

- `ANTHROPIC_API_KEY` + optional `ANTHROPIC_MODEL`
  Enables Claude-generated change-order summaries, risk highlights, and reviewer notes.
- `SLACK_WEBHOOK_URL`
  Enables real Slack alerts for approvals, sync failures, and urgent commercial changes.
- `EMAIL_PROVIDER` + `EMAIL_API_KEY` + `EMAIL_FROM` + `APP_BASE_URL`
  Enables password recovery, invite emails, approval notifications, and system alerts.
- `S3_*`
  Enables blueprint, quote, document, and attachment uploads from the create-change-order modal and project detail pages.

## Auth providers

These are optional, but they make the login flow feel much more complete:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

Use these only when we convert the current staged Google/Microsoft buttons into real OAuth sign-in.

## External system integrations

These are optional unless you want real sync demos with sandbox accounts:

- `PROCORE_BASE_URL`
- `PROCORE_CLIENT_ID`
- `PROCORE_CLIENT_SECRET`
- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`
- `NETSUITE_ACCOUNT_ID`
- `NETSUITE_CLIENT_ID`
- `NETSUITE_CLIENT_SECRET`
- `WEBHOOK_SIGNING_SECRET`

These unlock:

- real outbound sync instead of mocked status flips
- real webhook validation
- sync retries with provider-specific errors
- demo flows that look closer to production integrations work

## What each API unlocks in the product

### Anthropic Claude

- AI-generated change-order summary in the create flow
- review notes and urgency explanations
- better project-level commercial summaries

### Slack

- approval alerts
- sync failure alerts
- executive exposure notifications

### Email provider

- invite users
- reset password
- notify reviewers and project owners
- deep-link reset emails back into the login modal

### S3-compatible storage

- upload blueprints and quotes
- attach files to change orders
- browse project documents in the project details view

### Google / Microsoft OAuth

- real SSO login
- cleaner recruiter/demo experience

### Procore / QuickBooks / NetSuite sandbox

- real sync status and error handling
- external reference IDs tied to actual providers
- inbound webhooks that update the app automatically

## Recommended build order

If the goal is a stronger portfolio app, build in this order:

1. Replace all placeholder internal pages with real product screens.
2. Add document uploads and CSV import/export.
3. Upgrade auth with invites, password reset, and optionally SSO.
4. Connect Slack, email, and Anthropic Claude.
5. Only then wire real external sync providers.

That sequence gives the biggest product-quality jump without forcing you to set up every external API up front.
