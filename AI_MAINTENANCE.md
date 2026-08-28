# AI Maintenance Guide

This repository is intentionally structured for safe AI-assisted maintenance.

## Before changing code

Read `README.md`, `SECURITY.md`, `CONTRIBUTING.md`, the relevant source files, and `todo.md`. Describe the requested behavior in a small checklist before editing. Do not infer credentials from local files, and do not modify generated migration history destructively.

## Database discipline

The canonical database is PostgreSQL. Update `drizzle/schema.ts` first, generate and review a migration, then apply it in a controlled environment. Preserve unique constraints used for notification idempotency. Never replace production data with fixtures.

## Scheduled job discipline

The daily expiry check must remain idempotent. A retry must not send another notification for the same domain, notification type, and target expiry date. Failures should be recorded without exposing secrets in logs. Do not add `setInterval`, `node-cron`, or in-process timers.

## Security discipline

Use the existing signed session infrastructure. Keep state-changing requests protected by authentication and origin checks. Validate all URLs server-side and allow only HTTPS renewal links. Never put server secrets in client code or variables with a `VITE_` prefix.

## Review checklist

Run `pnpm check`, `pnpm test`, and `pnpm build`. For UI work, verify public, unauthenticated, authenticated, empty, loading, error, and mobile states. For security-sensitive work, add or update a Vitest test before declaring the change complete.
