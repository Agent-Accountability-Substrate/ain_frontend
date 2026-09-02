import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AgentCreationView } from "@/domains/agents/agent-creation-view";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

export const dynamic = "force-dynamic";

export default async function AgentCreationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  // Which organisation this agent belongs to comes from the URL, matching the
  // registry's own path-scoped tenancy: /orgs/{organisation_id}/agents.
  const selected = (await searchParams)["org"];
  const workspace = await loadWorkspace(
    typeof selected === "string" ? selected : null,
  );
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        currentPath="/agents/new"
        detail={workspace.detail}
        email={session.user.email}
        workspaceLabel="Create agent"
      />
    );
  }

  return (
    <AgentCreationView email={session.user.email} state={workspace.state} />
  );
}
