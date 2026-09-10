import { notFound } from "next/navigation";

import { AgentRecordView } from "@/domains/agents/agent-record-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { ainFromParam } from "@/domains/workspace/workspace-routes";
import { getAgent } from "@/lib/registry/registry-api";

export const dynamic = "force-dynamic";

/**
 * One agent's record.
 *
 * The AIN arrives from the path still percent-encoded, so it is decoded here —
 * once, at the boundary. Beyond this line it is the byte-exact identifier the
 * registry minted, and it is never re-cased or re-formatted, because it is
 * hashed and signed as written.
 *
 * The organisation is resolved first, so an agent belonging to a tenant this
 * account is not in is unreachable before the agent read is even attempted.
 */
export default async function AgentRecordPage({
  params,
}: {
  params: Promise<{ org: string; ain: string }>;
}) {
  const { org, ain } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  const agent = await getAgent(page.organisation.id, ainFromParam(ain));
  if (agent === null) notFound();

  return <AgentRecordView agent={agent} organisation={page.organisation} />;
}
