import { AgentRegisterView } from "@/domains/agents/agent-register-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  return (
    <AgentRegisterView organisation={page.organisation} state={page.state} />
  );
}
