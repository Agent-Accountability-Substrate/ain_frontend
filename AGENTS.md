# AGENTS.md — ain_frontend

Thin pointer. Canonical guidance lives in the **[`ain_docs`](https://github.com/Agent-Accountability-Substrate/ain_docs)** repo — [`AGENTS.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/AGENTS.md) and [`architecture.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/architecture.md). This file notes only what's specific to `ain_frontend`.

## This repo's rules
- Calls `ain_backend_api` **over a typed HTTP client**; **validate every response with Zod** at the boundary. No DB, no domain logic.
- The **public resolver view shows no tenant data and requires no login** — keep tenant data off that path entirely.
- App Router: `page.tsx` / `route.ts` are entry points only; logic under `domains/`. `as const` over enums; state order server → URL → `useState` → Context; **no browser storage** for app state.
- The browser **never** holds key material.

## Conventions
`conventions-frontend.md`, `conventions-shared.md`, `conventions-security.md` (in the `ain_docs` repo).

## Git
Never commit / push / PR / merge without explicit instruction; wait for green CI.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
