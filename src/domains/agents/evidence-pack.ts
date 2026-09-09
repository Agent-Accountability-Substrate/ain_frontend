import type { PackStatus } from "@/lib/registry/pack-status";

/**
 * An evidence package, as the workspace shows it.
 *
 * The register answers "which agents exist" and the agent record answers "what
 * was this one allowed to do". This answers the question a regulator asks: *show
 * me what this agent did in July, and prove it*. The registry assembles the
 * period's records into a signed bundle away from the request, so a package is a
 * thing with a lifetime — asked for, generated, and then fetchable — rather than
 * a report that renders.
 *
 * Nothing here verifies anything. Verification happens in `ain_services`, is
 * recorded inside the signed bundle, and is printed on the PDF. This layer shows
 * what the registry recorded and hands over a link; a browser that recomputed a
 * hash would be a second implementation of the one thing that must have exactly
 * one.
 */

/**
 * One package as every read reports it.
 *
 * `contentHash`, `exportSignature` and `kid` are absent until it is generated
 * and present together once it is. They are what makes the bundle checkable
 * without trusting this screen: recompute the bundle's canonical hash, compare,
 * then verify the signature against the published key for `kid`.
 *
 * There is deliberately no storage key and no digest of the PDF. The registry
 * serves a link rather than an address, and the PDF is a rendering rather than a
 * second signed artefact — its own page prints the three values above, which is
 * the whole of what ties it to the package.
 */
export type EvidencePack = {
  packId: string;
  ain: string;
  packType: string;
  packVersion: string;
  rangeStart: string;
  rangeEnd: string;
  status: PackStatus;
  contentHash?: string;
  exportSignature?: string;
  kid?: string;
  createdAt: string;
};

/**
 * One package with links to what was generated for it.
 *
 * Minted per request and never stored, because the signature inside a presigned
 * URL *is* the credential — so these are short-lived by design, and
 * `downloadExpiresIn` is how long this render's links last. Absent while the
 * package is unfinished, and absent in a deployment whose registry has no
 * object-storage access, which is the truth about that deployment rather than a
 * reason to hide the record.
 */
export type EvidencePackDetail = EvidencePack & {
  downloadUrl?: string;
  pdfDownloadUrl?: string;
  downloadExpiresIn?: number;
};

/**
 * One page of an agent's packages, and where the next one starts.
 *
 * A page because the registry keeps every package ever requested, so the
 * listing grows without bound. `nextCursor` is absent at the end of it, and
 * opaque everywhere else — it encodes an ordering the listing does not
 * promise, so it is carried back verbatim and never taken apart.
 *
 * Forward-only: there is no cursor for the page before. A reader goes deeper
 * or returns to the newest, which is what a listing ordered newest-first is
 * actually read for.
 */
export type EvidencePackPage = {
  packs: readonly EvidencePack[];
  nextCursor?: string;
};

/** The one package type the MVP ships (`architecture.md` M9). */
export const PACK_TYPE = "agent-activity";
export const PACK_VERSION = "1";

/**
 * The eight records a package carries, in the order the product describes them.
 *
 * Listed on the screen that asks for one, so what arrives is what was expected.
 * The order is the public description's and the rendered PDF's; keeping a third
 * spelling of it in step is the price of showing it before it exists.
 */
export const PACKAGE_CONTENTS = [
  "Identity evidence",
  "Accountability record",
  "Scope in force",
  "Relevant action receipts",
  "Policy and model versions",
  "Lifecycle history",
  "Chain and signature verification results",
  "Signed package manifest",
] as const;

/** Work the registry is still doing, so the screen knows to look again. */
export const isInFlight = (pack: Pick<EvidencePack, "status">): boolean =>
  pack.status === "queued" || pack.status === "generating";

/**
 * Which packages are still being assembled, by id.
 *
 * The ids rather than a flag, so the screen that watches them can tell one run
 * of work from the next: a package requested after an earlier one stopped
 * being followed is different work, and gets followed on its own terms.
 */
export const inFlightIds = (packs: readonly EvidencePack[]): string[] =>
  packs.filter(isInFlight).map((pack) => pack.packId);

/**
 * What each status means, said as an outcome rather than as a queue state.
 *
 * "Queued" and "generating" both mean *come back shortly*, so they read the
 * same; the distinction is real inside the registry and is not this reader's.
 */
export const PACK_STATUS_LABELS: Record<PackStatus, string> = {
  queued: "Being assembled",
  generating: "Being assembled",
  completed: "Ready",
  failed: "Could not be assembled",
};

/**
 * A period, as a person reads it.
 *
 * In UTC and said so. The bounds are the ones the package was assembled
 * against, and a browser rendering them in its own zone would show a July
 * package as covering the last day of June — at exactly the month boundaries
 * these land on.
 */
export function packPeriod(
  pack: Pick<EvidencePack, "rangeStart" | "rangeEnd">,
) {
  return `${utcDay(pack.rangeStart)} to ${utcDay(pack.rangeEnd)} UTC`;
}

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function utcDay(instant: string): string {
  return DAY.format(new Date(instant));
}

const MOMENT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function utcMoment(instant: string): string {
  return `${MOMENT.format(new Date(instant))} UTC`;
}

/**
 * The instants a calendar date means for a package's period.
 *
 * A date input hands over `2026-07-01` with no zone, and the registry demands an
 * offset precisely so nobody has to guess one. UTC is the guess made openly:
 * the form says the period is UTC, and the whole day is included at both ends,
 * so "1 to 31 July" covers the 31st rather than stopping at its first instant.
 */
export function periodStart(date: string): string {
  return `${date}T00:00:00Z`;
}

export function periodEnd(date: string): string {
  return `${date}T23:59:59Z`;
}
