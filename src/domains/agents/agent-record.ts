import type { WorkspaceAgent } from "@/domains/workspace/account-workspace";

/**
 * One agent's whole record, as the workspace shows it.
 *
 * The register lists agents; this is the thing a compliance lead opens when a
 * regulator asks *what was this agent allowed to do, and who answers for it*.
 * It is a projection of the rows `architecture.md` already specifies — `agent`
 * joined to its current `ain_document`, `scope_declaration`,
 * `named_accountability` and `external_identity_ref`, plus its
 * `lifecycle_event` chain.
 *
 * `document`, `scope` and `accountability` are absent on a draft rather than
 * empty: a draft has genuinely not declared them yet, and rendering an empty
 * scope would say "authorised to do nothing", which is a different claim.
 */

/** The signature envelope, which lives outside the signed bytes. */
export type AgentDocument = {
  documentVersion: number;
  documentHash: string;
  kid: string;
  validFrom: string;
};

/**
 * The authorised scope, exactly the four keys of the signed document's `scope`
 * object. `constraints` is open JSON by contract — the vocabulary, not this
 * layer, decides what `max_value_gbp` means — so it is rendered as the
 * key/value pairs it is rather than interpreted.
 */
export type AgentScope = {
  actionClasses: readonly string[];
  constraints: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  riskLevel: string;
  regulatoryMappings: readonly string[];
};

export type AgentAccountability = {
  roleTitle: string;
  responsibilityArea: string;
  /** An SMCR reference. A real person's regulatory registration. */
  regulatoryIdentifier: string;
};

export type AgentExternalIdentity = {
  refType: string;
  refValue: string;
  /** MVP stores the link; nothing verifies it yet. */
  verified: boolean;
};

/** One link in the agent's append-only, hash-chained lifecycle ledger. */
export type AgentLifecycleEvent = {
  seq: number;
  eventType: string;
  occurredAt: string;
  eventHash: string;
  /** Null only on genesis. */
  previousEventHash: string | null;
};

export type AgentRecord = WorkspaceAgent & {
  document?: AgentDocument;
  scope?: AgentScope;
  accountability?: AgentAccountability;
  externalIdentities: readonly AgentExternalIdentity[];
  lifecycle: readonly AgentLifecycleEvent[];
  /** Absent while the agent is a draft, because nothing resolves yet. */
  resolverUrl?: string;
};

/**
 * The transitions the registry will accept, given where an agent is now.
 *
 * Mirrors the lifecycle service rather than guessing: `revoked` is terminal,
 * `suspended` has no way back because `lifecycle_kind` has no reinstatement
 * event, and a draft has no chain to append to. Offering a transition the
 * registry would refuse is how a menu becomes a lie.
 */
export const AGENT_TRANSITIONS = ["suspend", "revoke"] as const;

export type AgentTransition = (typeof AGENT_TRANSITIONS)[number];

export function availableTransitions(
  status: string,
): readonly AgentTransition[] {
  if (status === "active") return AGENT_TRANSITIONS;
  if (status === "suspended") return ["revoke"];
  return [];
}

/**
 * Whether the chain links up, checked here rather than taken on trust.
 *
 * This is not cryptographic verification — the frontend never holds key
 * material and does not recompute `event_hash` from canonical bytes. It checks
 * the two things a reader can check from the list alone: that sequences are
 * gap-free from genesis, and that each entry names its predecessor's hash. A
 * break means the record on screen is not a chain, which is worth saying
 * plainly rather than rendering a tidy timeline over.
 */
export function chainIsContiguous(
  events: readonly AgentLifecycleEvent[],
): boolean {
  return events.every((event, index) => {
    const previous = events[index - 1];
    return (
      event.seq === index + 1 &&
      event.previousEventHash === (previous?.eventHash ?? null)
    );
  });
}

/** Human wording for a lifecycle event, keeping the registry's own vocabulary. */
export const LIFECYCLE_LABELS: Record<string, string> = {
  registered: "Registered",
  approved: "Approved and signed",
  updated: "Document superseded",
  suspended: "Suspended",
  revoked: "Revoked",
  transferred: "Transferred",
};
