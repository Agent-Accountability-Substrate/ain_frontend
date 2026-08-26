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

/**
 * The passport deck's facts live in `lib/brand` because the sign-up panel
 * prints the same record and cannot import out of this surface. Re-exported
 * here so a marketing component still has one place to import from.
 */
export {
  PASSPORT_VERSIONS,
  type PassportVersion,
} from "@/lib/brand/example-agent";

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
