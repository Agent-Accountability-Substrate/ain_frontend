import "server-only";

import { notFound } from "next/navigation";

import { currentSession } from "@/auth";
import type {
  AccountWorkspaceState,
  OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import { loadWorkspace } from "@/domains/workspace/workspace-page";
import { selectedOrganisation } from "@/domains/workspace/workspace-routes";

/**
 * The three lines every organisation-scoped page begins with.
 *
 * Signed in, registry answering, and the ULID in the address is one this
 * account belongs to — three checks whose *order* is the security-relevant
 * part.
 *
 * An outage is `"unavailable"` and the page renders nothing: the layout above
 * has already replaced the whole frame with the outage screen, so anything the
 * page produced would be discarded. It still has to return rather than throw,
 * because Next runs the two in parallel.
 */
export type OrganisationPage =
  | {
      status: "ready";
      email: string | null | undefined;
      name: string | null | undefined;
      organisation: OrganisationSummary;
      state: AccountWorkspaceState;
    }
  | { status: "unavailable" };

export async function loadOrganisationPage(
  org: string,
): Promise<OrganisationPage> {
  const session = await currentSession();
  if (!session?.user) return { status: "unavailable" };

  const workspace = await loadWorkspace(org);
  if (workspace.status === "unavailable") return { status: "unavailable" };

  // An organisation this account is not in is indistinguishable from one that
  // does not exist, which is the point: the ULID resolves against the caller's
  // own membership list, so there is no separate authorisation branch and
  // nothing to leak by getting it wrong.
  const organisation = selectedOrganisation(workspace.state);
  if (!workspace.state.namedOrganisationFound || organisation === null) {
    notFound();
  }

  return {
    status: "ready",
    email: session.user.email,
    name: session.user.name,
    organisation,
    state: workspace.state,
  };
}
