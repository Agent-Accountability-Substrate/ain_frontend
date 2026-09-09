import { notFound } from "next/navigation";

import { EvidencePackListView } from "@/domains/agents/evidence-pack-list-view";
import { loadOrganisationPage } from "@/domains/workspace/organisation-page";
import { ainFromParam } from "@/domains/workspace/workspace-routes";
import { getAgent, listEvidencePacks } from "@/lib/registry/registry-api";

export const dynamic = "force-dynamic";

/**
 * One page of the evidence packages requested for one agent.
 *
 * The organisation is resolved first, so an agent belonging to a tenant this
 * account is not in is unreachable before either read is attempted. The agent
 * is read before the packages for the same reason the record page reads it: a
 * package list under an AIN this organisation does not hold is not an empty
 * list, it is a 404.
 *
 * The cursor comes from the address, so a page of the listing is a place. It
 * is passed to the registry exactly as it arrived and never inspected here: a
 * cursor this listing did not issue names no position, and the registry
 * answers it with the first page rather than an error.
 */
export default async function EvidencePacksPage({
  params,
  searchParams,
}: {
  params: Promise<{ org: string; ain: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { org, ain } = await params;
  const page = await loadOrganisationPage(org);
  if (page.status !== "ready") return null;

  const agent = await getAgent(page.organisation.id, ainFromParam(ain));
  if (agent === null) notFound();

  // Repeated in the address, a param arrives as an array. Only a single value
  // is a position; anything else starts from the newest.
  const requested = (await searchParams).cursor;
  const cursor = typeof requested === "string" ? requested : undefined;
  const listing = await listEvidencePacks(
    page.organisation.id,
    agent.ain,
    cursor,
  );

  return (
    <EvidencePackListView
      agent={agent}
      organisation={page.organisation}
      listing={listing}
      {...(cursor !== undefined && { cursor })}
    />
  );
}
