import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationCreationView } from "@/components/organisation-creation-view";
import { loadAccountWorkspace } from "@/lib/registry-api";

export const dynamic = "force-dynamic";

export default async function OrganisationCreationPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  // No individual-assurance gate here, deliberately. This page used to
  // redirect to /onboarding/identity unless the caller was verified, which
  // would deadlock the product: nothing writes `identity_assurance` — an
  // identity provider and trust-ops own it, and the provider is an unmade
  // decision — so every caller is `not_started` and nobody could ever
  // register a company.
  //
  // It is also the wrong place for the rule. The registry lets anyone with a
  // verified address register one, keeps it `pending` and inert, and puts the
  // real check at trust-ops confirming registration number, legal entity and
  // the creator's authority to represent it (DECISIONS.md, 2026-08-15). A
  // stricter gate in a client duplicates an authorisation decision somewhere
  // it cannot be enforced. The suggested order still shows in the next-action
  // list, as guidance rather than a lock.
  return (
    <OrganisationCreationView
      email={session.user.email}
      state={await loadAccountWorkspace()}
    />
  );
}
