/**
 * Every word and figure on the public landing page, in one place.
 *
 * Extracted from the components for two reasons. The page is the product's
 * public claim about what it does, so the copy is reviewed as prose rather
 * than read out of JSX; and the passport deck and diff are *illustrations* of
 * a real record, so they need to stay obviously fictional and obviously
 * consistent with each other. `EXAMPLE-ORG` and the example key id are load
 * bearing — an AIN that looked real would be quoted back at us.
 *
 * Nothing here is fetched. The public page shows no tenant data and needs no
 * login, so it must render identically for everyone, signed in or not.
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
export const PASSPORT_VERSIONS: readonly PassportVersion[] = [
  {
    id: "v1",
    event: "issued",
    accountable: "Head of Payment Operations",
    scope: ["payments.initiate"],
    issuedOn: "4 Mar 2026",
  },
  {
    id: "v2",
    event: "scope amended",
    accountable: "Head of Payment Operations",
    scope: ["payments.initiate", "payments.refund"],
    issuedOn: "19 May 2026",
  },
  {
    id: "v3",
    event: "in force",
    accountable: "Head of Operational Resilience",
    scope: ["payments.initiate", "payments.refund"],
    issuedOn: "23 Jul 2026",
    inForce: true,
  },
].map(toVersion);

type DiffLine = { kind: "context" | "added" | "removed"; text: string };

/**
 * A scope amendment as it appears on the record: v8 superseded by v9.
 *
 * The sign is a real character in the markup rather than a colour, so the diff
 * still reads when it is pasted into a questionnaire in black and white.
 */
export const SCOPE_DIFF: readonly DiffLine[] = [
  { kind: "context", text: '"action_classes": [' },
  { kind: "context", text: '  "customer_comms.send",' },
  { kind: "added", text: '  "payments.initiate"' },
  { kind: "context", text: "]," },
  { kind: "added", text: '"constraints": {' },
  { kind: "added", text: '  "payments.initiate": { "max_value_gbp": 5000 }' },
  { kind: "added", text: "}," },
  { kind: "removed", text: '"risk_level": "medium",' },
  { kind: "added", text: '"risk_level": "high",' },
  { kind: "context", text: '"regulatory_mappings": ["FCA CONC 7"]' },
];

type ChainEntry = {
  sequence: number;
  event: string;
  hash: string;
  /** What the entry chains back to — genesis for the first. */
  previous: string;
  signedOn: string;
  verdict: "Verified" | "Altered" | "Broken";
};

/**
 * The tamper demonstration: entry 2 has been edited, so it no longer matches
 * its own hash and every entry after it fails with it.
 */
export const CHAIN_ENTRIES: readonly ChainEntry[] = [
  {
    sequence: 1,
    event: "registered",
    hash: "sha256:3c81a4…9de2",
    previous: "genesis · AIN-LIFECYCLE-GENESIS-v1",
    signedOn: "2026-05-07",
    verdict: "Verified",
  },
  {
    sequence: 2,
    event: "approved",
    hash: "sha256:7b02f5…41ac",
    previous: "← prev 3c81a4…9de2",
    signedOn: "2026-05-24",
    verdict: "Altered",
  },
  {
    sequence: 3,
    event: "updated",
    hash: "sha256:d914e0…6f37",
    previous: "← prev 7b02f5…41ac",
    signedOn: "2026-06-11",
    verdict: "Broken",
  },
  {
    sequence: 4,
    event: "updated",
    hash: "sha256:9f41c2…7ab0",
    previous: "← prev d914e0…6f37",
    signedOn: "2026-07-16",
    verdict: "Broken",
  },
];

export const FAQ_ENTRIES: readonly { question: string; answer: string }[] = [
  {
    question: "Does the check slow the agent down?",
    answer:
      "It is a lookup against the scope in force, not an inference call. The register returns a decision and records the authority the decision relied on.",
  },
  {
    question: "Is it a record or a control?",
    answer:
      "A record that answers in real time. It says whether an action is inside the authorised scope and keeps that answer; blocking the action stays your runtime’s job.",
  },
  {
    question: "What happens when the person in the role leaves?",
    answer:
      "The record binds a role and its regulatory identifier, so the successor inherits it with an effective date. Every prior version keeps the identifier that was accountable at the time.",
  },
  {
    question: "What does it hold about our customers?",
    answer:
      "The record of authority, not the customer data an agent touches. Your runtime logs are referenced by pointer and never ingested, and no other firm can read your records.",
  },
];

export const SECTION_LINKS: readonly { label: string; href: string }[] = [
  { label: "How it works", href: "#record" },
  { label: "Integrity", href: "#integrity" },
  { label: "Questions", href: "#questions" },
];

/** Where a demo request lands. Shown on the page, so it is stated once. */
export const PARTNER_EMAIL = "partner@subrahq.com";
