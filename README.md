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
pnpm dev        # http://localhost:3000
```

Checks (all four must be green — CI runs the same set):

```sh
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm test       # Vitest, 90% coverage thresholds enforced
pnpm build      # Next.js production build
```

### Phase 0 status
Phase 0 ships a **static landing page only**. Authentication (Zitadel), the typed API client for `ain_backend_api`, and the three product surfaces — web app, trust-ops console, public resolver view — arrive in later phases per the `ain_docs` build plan.
