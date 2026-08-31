/**
 * Every word and figure on the public landing page, in one place.
 *
 * Extracted from the components for two reasons. The page is the product's
 * public claim about what it does, so the copy is reviewed as prose rather
 * than read out of JSX; and the passport deck is an *illustration* of a real
 * record, so it needs to stay obviously fictional. `EXAMPLE-ORG` and the
 * example key id are load
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

export const FAQ_ENTRIES: readonly { question: string; answer: string }[] = [
  {
    question: "What exactly is captured in an action receipt?",
    answer:
      "The identity presented, the organisation, the accountable owner, the action and its intent, the declared authority and scope result, the policy and model versions in force, and a signature over the whole record.",
  },
  {
    question: "Can evidence be verified without Subra?",
    answer:
      "Yes. Verification recalculates the record from its contents rather than trusting a stored result. Evidence packages are designed to be checked independently, including when the originating system is unavailable.",
  },
  {
    question:
      "How is declared scope different from a runtime permission check?",
    answer:
      'Scope result is a classification recorded on the evidence, "inside declared scope" or "outside declared scope", not a decision Subra makes about whether the action is allowed to happen.',
  },
  {
    question:
      "What happens when scope, policy, model or accountable owner changes?",
    answer:
      "The change is recorded as a new version. Historical receipts remain bound to the version that was in force when the action occurred.",
  },
  {
    question: "Does Subra replace our identity or IAM system?",
    answer:
      "No. Subra accepts the identity your systems already present through ARIA, DID/VC, OAuth/OIDC or your enterprise IAM, and builds accountability and evidence around it.",
  },
  {
    question: "Does Subra sit in the agent's runtime path?",
    answer:
      "No. Subra is never a required dependency for an agent to act. It records evidence after an action has occurred.",
  },
  {
    question: "What customer data does Subra store?",
    answer:
      "The minimum evidence necessary for the record, including identity references, accountability, scope, version and receipt data. Runtime logs are referenced by pointer, not copied in.",
  },
  {
    question: "Is Subra a regulator or a compliance certification service?",
    answer:
      "No. Subra produces evidence intended to help your organisation answer accountability questions. It does not certify compliance and is not a regulator.",
  },
];

export const SECTION_LINKS: readonly { label: string; href: string }[] = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Integrity", href: "#integrity" },
  { label: "Questions", href: "#questions" },
];

/** Where a demo request lands. Shown on the page, so it is stated once. */
export const PARTNER_EMAIL = "partner@subrahq.com";

export const LANDING_TITLE =
  "Subra — Evidence and Accountability for High-Stakes AI-Agent Actions";
export const LANDING_DESCRIPTION =
  "Subra turns high-stakes AI-agent actions into signed, independently verifiable evidence — built for regulated organisations, currently in private preview.";
