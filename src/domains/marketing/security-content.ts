export const SECURITY_BOUNDARIES = [
  {
    id: "minimum-evidence",
    label: "Minimum necessary evidence recorded",
    detail:
      "Subra records the identity, accountable context, action, scope result and versions needed to explain an action. Customer payloads are excluded by default.",
  },
  {
    id: "runtime-pointers",
    label: "Runtime-log pointers referenced, not customer data copied",
    detail:
      "Receipts can carry a reference to evidence held in your own environment. Subra does not need the contents of the underlying runtime log.",
  },
  {
    id: "tenant-isolation",
    label: "Tenant isolation",
    detail:
      "Organisation-scoped records remain within their tenant boundary. The public verification surface contains no private tenant data.",
  },
  {
    id: "signing-boundary",
    label: "Private signing-key boundary",
    detail:
      "Signing occurs inside the restricted signing service. Private signing keys are not returned to application code or held in the browser.",
  },
  {
    id: "append-only-history",
    label: "Append-only version history",
    detail:
      "New lifecycle and receipt entries are appended and linked in order. Earlier versions are retained rather than edited in place.",
  },
  {
    id: "deterministic-verification",
    label: "No LLM in the verification path",
    detail:
      "Verification canonicalises the supplied record, recalculates its hash, checks its signature and resolves key status. The result is deterministic.",
  },
  {
    id: "no-runtime-gating",
    label: "No runtime gating",
    detail:
      "Subra records completed actions and can answer verification requests. It does not sit in the agent runtime as an approval gateway.",
  },
  {
    id: "no-universal-identity",
    label: "Does not issue a universal identity",
    detail:
      "Subra accepts the external identity already presented and binds it to accountable evidence. It does not ask the ecosystem to adopt one universal identity standard.",
  },
  {
    id: "no-wallet",
    label: "Does not operate a wallet",
    detail:
      "Subra is not a credential wallet, agent key store or identity custody product. Existing identity and credential systems remain in place.",
  },
  {
    id: "customer-enforcement",
    label: "Does not make your enforcement decision for you",
    detail:
      "A scope result classifies the evidence recorded. Your organisation remains responsible for deciding whether an action is allowed or blocked.",
  },
] as const;
