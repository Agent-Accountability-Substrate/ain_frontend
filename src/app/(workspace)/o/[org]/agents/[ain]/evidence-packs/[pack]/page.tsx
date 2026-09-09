import { notFound } from "next/navigation";

import { EvidencePackView } from "@/domains/agents/evidence-pack-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { ainFromParam } from "@/domains/workspace/workspace-routes";
import { getAgent, getEvidencePack } from "@/lib/registry/registry-api";

export const dynamic = "force-dynamic";

/**
 * One evidence package, with links to the files it produced.
 *
 * Never cached, and this is the read where that matters most. The registry
 * mints the download links per request and they carry their own credential, so
 * a cached render would hand a later reader a link somebody else was
 * authorised for — and hand the reader who asked one that had already expired.
 */
export default async function EvidencePackPage({
  params,
}: {
  params: Promise<{ org: string; ain: string; pack: string }>;
}) {
  const { org, ain, pack: packId } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  const agent = await getAgent(page.organisation.id, ainFromParam(ain));
  if (agent === null) notFound();

  const pack = await getEvidencePack(
    page.organisation.id,
    agent.ain,
    decodeURIComponent(packId),
  );
  if (pack === null) notFound();

  return (
    <EvidencePackView
      agent={agent}
      organisation={page.organisation}
      pack={pack}
    />
  );
}
