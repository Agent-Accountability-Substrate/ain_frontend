import { AgentCreationView } from "@/domains/agents/agent-creation-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { ainFromParam } from "@/domains/workspace/workspace-routes";

export const dynamic = "force-dynamic";

/**
 * Registering an agent — or finishing one that was started.
 *
 * `?draft=<ain>` resumes. The identifier is resolved against this
 * organisation's own register, which the workspace has already read for this
 * request, so a fabricated or foreign AIN in the query resolves to nothing,
 * and so does an agent that is no longer a draft: its scope changes by
 * supersede, not by this form.
 *
 * What an unresolved identifier must never do is open a blank wizard. A draft
 * is a real row holding a permanent AIN, and a resume link landing on the
 * identity step would mint a second identifier for the same agent on the
 * first click. The single-agent read is not the way to resolve it either: the
 * registry does not serve that read yet, the client reports its absence as
 * "no record", and for a while that absence was read as "start afresh".
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
  const requestedAin =
    typeof requested === "string" ? ainFromParam(requested) : null;
  const record =
    requestedAin === null
      ? null
      : (page.state.agents.find(
          (agent) =>
            agent.organisationId === page.organisation.id &&
            agent.ain === requestedAin,
        ) ?? null);
  const draft =
    record?.status === "draft" ? { ain: record.ain, name: record.name } : null;

  return (
    <AgentCreationView
      draft={draft}
      organisation={page.organisation}
      unresolvedDraft={
        requestedAin !== null && draft === null ? requestedAin : null
      }
    />
  );
}
