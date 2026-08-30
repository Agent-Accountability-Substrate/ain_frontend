export type IndividualAssuranceStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "needs_review"
  | "failed"
  | "expired";

export type IndividualAssuranceSummary = {
  status: IndividualAssuranceStatus;
  assuranceProfile?: string;
  providerReference?: string;
  checkedAt?: string;
  expiresAt?: string;
  reviewReason?: string;
};

/**
 * Until a server-owned verification record exists, the UI must fail closed
 * and must never infer identity assurance from the Auth0 session.
 */
export const initialIndividualAssurance: IndividualAssuranceSummary = {
  status: "not_started",
};

/**
 * What a provider profile actually establishes, in words rather than in its
 * token.
 *
 * `verified` on its own would mean "controls a mailbox" today and "passed a
 * document and liveness check" once a provider lands, so the profile is what
 * carries the claim (`ain_docs` DECISIONS.md, 2026-08-16).
 *
 * An unrecognised token is never rewritten into English; it stays a token, and
 * the caller renders it as the identifier it is.
 */
const PROFILE_LABELS: Record<string, string> = {
  email_verified: "email only",
  uk_gpg45_medium: "UK GPG45 medium",
};

/** The profile the registry derives, rather than one a provider issued. */
const EMAIL_ONLY_PROFILE = "email_verified";

export function assuranceProfileLabel(
  profile: string | undefined,
): string | null {
  return profile === undefined ? null : (PROFILE_LABELS[profile] ?? null);
}

/**
 * The one level the product derives rather than checks: a confirmed address,
 * which says nothing about who holds it.
 *
 * Matches *this profile* rather than "anything below our target", because an
 * unrecognised token may well be stronger, and the copy this gates makes a
 * claim about email specifically.
 */
export function isEmailOnlyAssurance(
  summary: IndividualAssuranceSummary,
): boolean {
  return (
    summary.status === "verified" &&
    summary.assuranceProfile === EMAIL_ONLY_PROFILE
  );
}
