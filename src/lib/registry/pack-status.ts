/**
 * Where an evidence package request has got to, as the registry reports it.
 *
 * The wire contract, so it lives at the boundary that validates the wire rather
 * than in the domain that renders it — one spelling, checked by Zod on the way
 * in, and a status the registry gains that nothing here knows about fails
 * loudly at the boundary instead of rendering as a blank pill.
 *
 * Its own module rather than the client's: a domain needs the type, and the
 * client is `server-only`, so importing it from there would drag that into a
 * component the browser renders.
 *
 * `queued` and `generating` are both work in flight and differ only in whether
 * a worker has picked it up — a distinction that is the queue's business and
 * not a reader's. `failed` is a real outcome and is shown as one.
 */
export const PACK_STATUSES = [
  "queued",
  "generating",
  "completed",
  "failed",
] as const;

export type PackStatus = (typeof PACK_STATUSES)[number];
