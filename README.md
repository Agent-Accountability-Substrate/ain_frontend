# ain_frontend

The web surfaces for **AIN-Registry** — a Next.js application: the tenant **web app**, the **trust-operations console**, and the public **resolver view**.

> Canonical spec: the **[`ain_docs`](https://github.com/Agent-Accountability-Substrate/ain_docs)** repo — [`architecture.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/architecture.md) (normative), [`DECISIONS.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/DECISIONS.md), [`glossary.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/glossary.md).

## Role

- **Web app** (authenticated, tenant-scoped): register / manage agents, request and download evidence.
- **Trust-ops console** (`trust_ops` role): the org-verification queue, key state, audit log.
- **Public resolver view**: a server-rendered `/{ain}` page (the full `did:ain:…` identifier) — identity, status, scope, verify — with **no tenant data and no login**.
- Talks to `ain_backend_api` **over HTTP through a typed client**; holds no domain logic and no database.

## Layering

`ain_frontend → ain_backend_api → …`. The frontend's only dependency is the HTTP API.

## Stack

TypeScript · Next.js (App Router) · Tailwind + shadcn/ui · Zod. Conventions: `conventions-frontend.md`, `conventions-shared.md`, `conventions-security.md` (in the `ain_docs` repo).

## Getting started

Requires **Node 24** (pinned in `.node-version`) and **pnpm 11**. Install pnpm via the [standalone installer](https://pnpm.io/installation) or `npm install -g pnpm@11` — do **not** use Corepack.

```sh
pnpm install
cp .env.example .env.local   # then fill in the Auth0 values (see Authentication)
pnpm dev                     # http://localhost:3000
```

Checks (all four must be green — CI runs the same set):

```sh
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm test       # Vitest, 90% coverage thresholds enforced
pnpm build      # Next.js production build
```

## Authentication

Login is **Auth0 via Auth.js** (generic OIDC — no provider-specific SDK, so the IdP stays swappable; see the `ain_docs` `DECISIONS.md` 2026-07-03 auth entry). Configure a local `.env.local` from `.env.example`:

- `AUTH_AUTH0_ID`, `AUTH_AUTH0_SECRET` — the Auth0 "Regular Web App" credentials.
- `AUTH_AUTH0_ISSUER` — `https://<your-auth0-domain>` (e.g. `https://your-tenant.uk.auth0.com`).
- `AUTH_SECRET` — session-cookie secret; generate with `openssl rand -hex 32`.

In the Auth0 application settings, set **Allowed Callback URLs** to `http://localhost:3000/api/auth/callback/auth0` and **Allowed Logout URLs** to `http://localhost:3000`. Sign-ups are disabled (invite-only): users are created by an admin in the Auth0 dashboard. `.env.local` is git-ignored — never commit real values.

### Phase 0 status

Phase 0 ships a **public landing page** and an **Auth0 login** guarding an otherwise-empty `/dashboard` (the "invited user logs in" exit test). The typed API client for `ain_backend_api` and the three product surfaces — web app, trust-ops console, public resolver view — arrive in later phases per the `ain_docs` build plan.
