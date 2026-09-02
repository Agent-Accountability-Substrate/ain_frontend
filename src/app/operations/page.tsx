import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OperationsView } from "@/domains/operations/operations-view";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";
import {
  checkRegistration,
  listReviewQueue,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
  type RegistrationCheck,
  type ReviewItem,
} from "@/lib/registry/registry-api";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

export const dynamic = "force-dynamic";

/**
 * The trust-operations console.
 *
 * Reached only by an operator, and refused three times over: the navigation
 * entry is absent, this page redirects, and the registry answers 403 to both
 * routes below regardless of either. The redirect is a courtesy — somebody who
 * followed a stale link should land somewhere useful rather than on a refusal.
 */
export default async function OperationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const workspace = await loadWorkspace();
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        currentPath="/operations"
        detail={workspace.detail}
        email={session.user.email}
        workspaceLabel="Trust operations"
      />
    );
  }
  if (!workspace.state.isOperator) redirect("/dashboard");

  let queue: readonly ReviewItem[];
  try {
    queue = await listReviewQueue();
  } catch (error) {
    if (error instanceof NotAuthenticatedError) redirect("/api/auth/signin");
    if (error instanceof RegistryUnavailableError) {
      return (
        <WorkspaceUnavailable
          currentPath="/operations"
          detail={error.detail ?? "The review queue could not be read."}
          email={session.user.email}
          workspaceLabel="Trust operations"
        />
      );
    }
    throw error;
  }

  const requested = (await searchParams)["org"];
  const selected =
    typeof requested === "string"
      ? (queue.find((item) => item.organisation_id === requested) ?? null)
      : null;

  // The register lookup is a separate call and a separate failure. It is
  // advisory, so it must never take the queue down with it: an operator can
  // still decide, they simply do the lookup by hand.
  let check: RegistrationCheck | null = null;
  let checkUnavailable: string | null = null;
  if (selected !== null) {
    try {
      check = await checkRegistration(selected.organisation_id);
    } catch (error) {
      if (error instanceof RegistryRefusedError) {
        checkUnavailable = error.detail;
      } else if (error instanceof RegistryUnavailableError) {
        checkUnavailable =
          error.detail ?? "Companies House could not be reached.";
      } else {
        throw error;
      }
    }
  }

  return (
    <OperationsView
      check={check}
      checkUnavailable={checkUnavailable}
      email={session.user.email}
      queue={queue}
      selected={selected}
    />
  );
}
