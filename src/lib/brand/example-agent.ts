/**
 * The fictional registered agent that both public surfaces print.
 *
 * The landing page deals it as a three-card deck; the sign-up panel shows the
 * version in force beside the form. One set of facts, because the two are
 * pictures of the same record and a visitor who sees both should not catch
 * them disagreeing — and because `marketing/` is a leaf surface that `auth/`
 * is not allowed to import out of, which leaves `lib/brand` as the only home
 * the two can share. The landing page's own copy re-exports what it needs, so
 * `landing-content.ts` remains the one import a marketing component reaches
 * for.
 *
 * `EXAMPLE-ORG` and the example key id are load bearing — an AIN that looked
 * real would be quoted back at us.
 */

export type PassportVersion = {
  /** `v1`, `v2`, `v3` — the document version, and the deck's stable key. */
  id: string;
  /** What happened at this version, shown beside the id on the card. */
  event: string;
  name: string;
  accountable: string;
  scope: readonly string[];
  ain: string;
  issuedOn: string;
  /** The one version in force. Only this card carries the accent. */
  inForce: boolean;
  record: readonly {
    label: string;
    /** A list renders a line each — the back face's Scope cell. */
    value: string | readonly string[];
    /**
     * `verified` is the clean-pass green. `in-force` accents the two facts the
     * section turns on — which version is current, and who answers for it —
     * and only the live card carries it.
     */
    tone?: "verified" | "in-force";
  }[];
};

const AGENT_NAME = "Payments Operations Agent";
const PERMANENT_AIN = "did:ain:gb:EXAMPLE-ORG:01BX5ZZ…EMMVRZ";
const AIN_GROUPED = "01BX 5ZZK BKAC TAV9";

/**
 * The card's two faces, built from one set of facts.
 *
 * The section argues that the signed record is what settles a dispute, so a
 * record disagreeing with the face of the card would undo it. Deriving both
 * from the same fields makes that impossible; `landing-content.test.ts`
 * asserts they agree.
 */
function toVersion(facts: {
  id: string;
  event: string;
  accountable: string;
  scope: readonly string[];
  issuedOn: string;
  inForce?: boolean;
}): PassportVersion {
  const inForce = facts.inForce ?? false;
  const live = inForce ? ("in-force" as const) : undefined;

  return {
    id: facts.id,
    event: facts.event,
    name: AGENT_NAME,
    accountable: facts.accountable,
    scope: facts.scope,
    ain: AIN_GROUPED,
    issuedOn: facts.issuedOn,
    inForce,
    record: [
      { label: "Agent", value: AGENT_NAME },
      { label: "Status", value: "Active", tone: "verified" },
      { label: "Permanent AIN", value: PERMANENT_AIN },
      { label: "Document version", value: facts.id, tone: live },
      { label: "Signature", value: "EdDSA" },
      { label: "Key id", value: "key-example-a1" },
      { label: "Accountable", value: facts.accountable, tone: live },
      // The same list the front shows, rendered a line each as the design has it.
      { label: "Scope", value: facts.scope },
      { label: "Last verified", value: `Signed ${facts.issuedOn}` },
    ],
  };
}

/**
 * Three versions of one agent, oldest first — the deck renders the last as the
 * card in front. The identifier is the same on all three and the accountable
 * role changes at v3, which is the whole point the section is making.
 */
const ISSUED = toVersion({
  id: "v1",
  event: "issued",
  accountable: "Head of Payment Operations",
  scope: ["payments.initiate"],
  issuedOn: "4 Mar 2026",
});

const AMENDED = toVersion({
  id: "v2",
  event: "scope amended",
  accountable: "Head of Payment Operations",
  scope: ["payments.initiate", "payments.refund"],
  issuedOn: "19 May 2026",
});

/**
 * The version in force, named rather than found at an index.
 *
 * A surface with room for one card shows this one — the sign-up panel does —
 * and `noUncheckedIndexedAccess` makes reaching for it by position a widening
 * to `undefined` that every caller then has to answer for.
 */
export const EXAMPLE_AGENT_IN_FORCE = toVersion({
  id: "v3",
  event: "in force",
  accountable: "Head of Operational Resilience",
  scope: ["payments.initiate", "payments.refund"],
  issuedOn: "23 Jul 2026",
  inForce: true,
});

export const PASSPORT_VERSIONS: readonly PassportVersion[] = [
  ISSUED,
  AMENDED,
  EXAMPLE_AGENT_IN_FORCE,
];
