import { AgentCreationView } from "@/domains/agents/agent-creation-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";

export const dynamic = "force-dynamic";

export default async function AgentCreationPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  return <AgentCreationView organisation={page.organisation} />;
}
