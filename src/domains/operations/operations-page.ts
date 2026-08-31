import "server-only";

import { redirect } from "next/navigation";

import { currentSession } from "@/auth";
import { loadWorkspace } from "@/domains/workspace/workspace-page";
import {
  checkRegistration,
  listReviewQueue,
  NotAuthenticatedError,
  RegistryRefusedError,
  RegistryUnavailableError,
  type RegistrationCheck,
  type ReviewItem,
} from "@/lib/registry/registry-api";

/**
 * Everything the trust-operations console needs, resolved before it renders.
 *
 * This used to sit in `page.tsx`, which is why the queue's own failure went
 * unhandled: the route file returned `null` for it, on the reasoning that the
 * layout above had already replaced the frame — true of the *workspace* being
 * unavailable, and not of this. The review queue is a separate call to a
 * separate route, so it can fail while the memberships and the assurance read
 * fine, and an operator then got the bar and the rail wrapped around nothing
 * at all on the most consequential screen in the product.
 */

const QUEUE_UNAVAILABLE =
  "The review queue could not be read. Nothing has been decided or lost — this page will work again once the registry is back.";

export type OperationsPageLoad =
  | { status: "unavailable"; detail: string; email: string | null | undefined }
  | {
      status: "ready";
      queue: readonly ReviewItem[];
      selected: ReviewItem | null;
      check: RegistrationCheck | null;
      checkUnavailable: string | null;
    };

export async function loadOperationsPage(
  requestedOrganisationId: string | undefined,
): Promise<OperationsPageLoad> {
  const session = await currentSession();
  if (!session?.user) redirect("/");
  const email = session.user.email;

  // The console renders the review queue, not any organisation's register.
  const workspace = await loadWorkspace(null, { withAgents: false });
  // The layout above has already replaced the frame with the outage screen, so
  // whatever this produced would be discarded. It still returns rather than
  // throws, because Next runs the two in parallel.
  if (workspace.status === "unavailable") {
    return { status: "unavailable", detail: workspace.detail, email };
  }
  if (!workspace.state.isOperator) redirect("/o");

  let queue: readonly ReviewItem[];
  try {
    queue = await listReviewQueue();
  } catch (error) {
    if (error instanceof NotAuthenticatedError) redirect("/api/auth/signin");
    if (error instanceof RegistryUnavailableError) {
      // The registry's own `detail` names a subsystem, which belongs in the
      // log rather than on the screen of somebody who did not cause it.
      return { status: "unavailable", detail: QUEUE_UNAVAILABLE, email };
    }
    throw error;
  }

  const selected =
    requestedOrganisationId === undefined
      ? null
      : (queue.find(
          (item) => item.organisation_id === requestedOrganisationId,
        ) ?? null);

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

  return { status: "ready", queue, selected, check, checkUnavailable };
}
