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
