# Contributing

Thank you for helping improve Domain Renewal Radar. Keep changes focused, tested, and compatible with the PostgreSQL schema used by Neon and Supabase.

## Development rules

Use Node.js 20 or newer and pnpm. Before opening a pull request, run `pnpm check`, `pnpm test`, and `pnpm build`. Database changes must include a Drizzle schema update and a reviewed migration. Do not commit `.env` files, tokens, production data, customer domains, or generated screenshots containing private information.

## Pull requests

Explain the problem, the behavior change, the security impact, and the test coverage. UI changes should include desktop and mobile verification notes. Changes to notifications must demonstrate idempotency and safe retry behavior.

## Original implementation

This project is independently implemented. Contributions should preserve the repository's own architecture, naming, UI, and security model rather than copying code from the reference worker or another project.
