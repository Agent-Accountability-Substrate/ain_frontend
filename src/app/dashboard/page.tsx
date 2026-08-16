import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";
import { WorkspaceUnavailable } from "@/components/workspace-unavailable";
import { loadWorkspace } from "@/lib/workspace-page";

// Reads the session and the registry per request; never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  // Fail closed independently of middleware — never render the authenticated
  // shell to an anonymous request.
  if (!session?.user) redirect("/");

  const workspace = await loadWorkspace();
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
