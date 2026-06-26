# ain_frontend

The web surfaces for **AIN-Registry** — a Next.js application: the tenant **web app**, the **trust-operations console**, and the public **resolver view**.

> Canonical spec: the **[`ain_docs`](https://github.com/Agent-Accountability-Substrate/ain_docs)** repo — [`architecture.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/architecture.md) (normative), [`DECISIONS.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/DECISIONS.md), [`glossary.md`](https://github.com/Agent-Accountability-Substrate/ain_docs/blob/main/glossary.md).

## Role
- **Web app** (authenticated, tenant-scoped): register / manage agents, request and download evidence.
- **Trust-ops console** (`trust_ops` role): the org-verification queue, key state, audit log.
- **Public resolver view**: a server-rendered `/{ULID}` page — identity, status, scope, verify — with **no tenant data and no login**.
- Talks to `ain_backend_api` **over HTTP through a typed client**; holds no domain logic and no database.

## Layering
`ain_frontend → ain_backend_api → …`. The frontend's only dependency is the HTTP API.

## Stack
TypeScript · Next.js (App Router) · Tailwind + shadcn/ui `[PROPOSED]` · Zod. Conventions: `conventions-frontend.md`, `conventions-shared.md`, `conventions-security.md` (in the `ain_docs` repo).

## Getting started
*Stub.* `pnpm install` `[PROPOSED]`; point at a running `ain_backend_api`; `pnpm dev`.
