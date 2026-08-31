import { redirect } from "next/navigation";

import { currentSession } from "@/auth";
import { IdentityOnboardingView } from "@/domains/identity/identity-onboarding-view";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

export const dynamic = "force-dynamic";

export default async function IdentityOnboardingPage() {
  const session = await currentSession();

  if (!session?.user) redirect("/");

  // A screen about a record has to read the record, or it reports "Not
  // started" to an account the registry already reports as verified. The fetch
  // is memoised per request, so this is the layout's read, not a second.
  const workspace = await loadWorkspace(null);
  if (workspace.status !== "ready") return null;

  return (
    <IdentityOnboardingView assurance={workspace.state.individualAssurance} />
  );
}
