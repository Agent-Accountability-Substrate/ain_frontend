import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationCreationView } from "@/components/organisation-creation-view";
import { initialAccountWorkspaceState } from "@/lib/account-workspace";

export const dynamic = "force-dynamic";

export default async function OrganisationCreationPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <OrganisationCreationView
      email={session.user.email}
      state={initialAccountWorkspaceState}
    />
  );
}
