import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationsView } from "@/components/organisations-view";
import { initialAccountWorkspaceState } from "@/lib/account-workspace";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <OrganisationsView
      email={session.user.email}
      state={initialAccountWorkspaceState}
    />
  );
}
