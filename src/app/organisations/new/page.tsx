import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationCreationView } from "@/components/organisation-creation-view";
import {
  initialAccountWorkspaceState,
  isAccountVerified,
} from "@/lib/account-workspace";

export const dynamic = "force-dynamic";

export default async function OrganisationCreationPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  // Organisation registration is gated on individual identity assurance. The
  // navigation lock in WorkspaceShell is presentation only, so the rule has to
  // be enforced here, at the route entry point, to survive a direct URL hit.
  if (!isAccountVerified(initialAccountWorkspaceState)) {
    redirect("/onboarding/identity");
  }

  return (
    <OrganisationCreationView
      email={session.user.email}
      state={initialAccountWorkspaceState}
    />
  );
}
