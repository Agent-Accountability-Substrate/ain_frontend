import { AgentCreationView } from "@/domains/agents/agent-creation-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { ainFromParam } from "@/domains/workspace/workspace-routes";
import { getAgent } from "@/lib/registry/registry-api";

export const dynamic = "force-dynamic";

/**
 * Registering an agent — or finishing one that was started.
 *
 * `?draft=<ain>` resumes. The identifier is resolved against this
 * organisation's own register before it reaches the wizard, so a fabricated or
 * foreign AIN in the query resolves to nothing and the screen opens as an
 * ordinary new registration rather than staging a declaration against an
 * identifier the caller cannot see. An agent that is no longer a draft is
 * treated the same way: its scope changes by supersede, not by this form.
 */
export default async function AgentCreationPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ draft?: string | string[] }>;
}) {
  const { org } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  const requested = (await searchParams).draft;
  const record =
    typeof requested === "string"
      ? await getAgent(page.organisation.id, ainFromParam(requested))
      : null;
  const draft =
    record?.status === "draft" ? { ain: record.ain, name: record.name } : null;

  return <AgentCreationView draft={draft} organisation={page.organisation} />;
}
