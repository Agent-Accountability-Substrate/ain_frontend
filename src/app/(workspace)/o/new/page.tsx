import { OrganisationCreationView } from "@/domains/organisations/organisation-creation-view";
import { loadAccountPage } from "@/domains/workspace/account-page";

export const dynamic = "force-dynamic";

/**
 * Registering a company.
 *
 * The one workspace screen with no organisation in its address, because it is
 * what produces one — and the only screen someone with no memberships can
 * reach.
 *
 * No individual-assurance gate here. The registry lets anyone with a verified
 * address register a company, keeps it `pending` and inert, and puts the real
 * check at trust-ops confirming registration number, legal entity and the
 * creator's authority to represent it (DECISIONS.md, 2026-08-15). A stricter
 * gate in a client would duplicate an authorisation decision somewhere it
 * cannot be enforced — and nothing writes `identity_assurance` yet, so it
 * would refuse everyone. The suggested order shows in the next-action list, as
 * guidance rather than a lock.
 */
export default async function NewOrganisationPage() {
  const page = await loadAccountPage();
  if (page.status !== "ready") return null;

  return <OrganisationCreationView state={page.state} />;
}
