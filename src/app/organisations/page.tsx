import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganisationsView } from "@/domains/organisations/organisations-view";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

export const dynamic = "force-dynamic";

export default async function OrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  // Which organisation is selected comes from the URL, not from a cookie or
  // from server memory. Every tenant route on the backend names its
  // organisation in the path; an ambient selection on the client would put
  // back exactly the implicit tenancy that removed.
  const selected = (await searchParams)["org"];
  const workspace = await loadWorkspace(
    typeof selected === "string" ? selected : null,
  );
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        currentPath="/organisations"
        detail={workspace.detail}
        email={session.user.email}
        workspaceLabel="Organisations"
      />
    );
  }

  return (
    <OrganisationsView email={session.user.email} state={workspace.state} />
  );
}
