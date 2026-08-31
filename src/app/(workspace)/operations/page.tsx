import { loadOperationsPage } from "@/domains/operations/operations-page";
import { OperationsView } from "@/domains/operations/operations-view";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";

export const dynamic = "force-dynamic";

/**
 * The trust-operations console.
 *
 * Reached only by an operator, and refused three times over: the navigation
 * entry is absent, the loader redirects, and the registry answers 403 to both
 * routes regardless of either. The redirect is a courtesy — somebody who
 * followed a stale link should land somewhere useful rather than on a refusal.
 */
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requested = (await searchParams)["org"];
  const page = await loadOperationsPage(
    typeof requested === "string" ? requested : undefined,
  );

  if (page.status === "unavailable") {
    return <WorkspaceUnavailable detail={page.detail} email={page.email} />;
  }

  return (
    <OperationsView
      check={page.check}
      checkUnavailable={page.checkUnavailable}
      queue={page.queue}
      selected={page.selected}
    />
  );
}
