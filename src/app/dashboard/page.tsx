import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardView } from "@/domains/workspace/dashboard-view";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

// Reads the session and the registry per request; never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  // Fail closed independently of middleware — never render the authenticated
  // shell to an anonymous request.
  if (!session?.user) redirect("/");

  // The selection lives in the URL, so this page has to read it. Rendering the
  // switcher while ignoring `?org=` made the control snap back to "Select an
  // organisation" the moment it was used -- multi-organisation membership is
  // the headline capability here, and it was unusable from the page a user
  // lands on first.
  const selected = (await searchParams)["org"];
  const workspace = await loadWorkspace(
    typeof selected === "string" ? selected : null,
  );
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        currentPath="/dashboard"
        detail={workspace.detail}
        email={session.user.email}
        workspaceLabel="Overview"
      />
    );
  }

  return <DashboardView email={session.user.email} state={workspace.state} />;
}
