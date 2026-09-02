import "server-only";

import { currentSession } from "@/auth";
import {
  contextOrganisation,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

/**
 * The preamble every account-level settings page begins with.
 *
 * No organisation is named, because none owns these pages. `organisation` is
 * only what the page uses to point at a company's own settings, and is null
 * for an account with no memberships.
 */
export type AccountPage =
  | {
      status: "ready";
      email: string | null | undefined;
      name: string | null | undefined;
      organisation: OrganisationSummary | null;
      state: AccountWorkspaceState;
    }
  | { status: "unavailable" };

export async function loadAccountPage(): Promise<AccountPage> {
  const session = await currentSession();
  if (!session?.user) return { status: "unavailable" };

  const workspace = await loadWorkspace(null);
  if (workspace.status === "unavailable") return { status: "unavailable" };

  return {
    status: "ready",
    email: session.user.email,
    name: session.user.name,
    organisation: contextOrganisation(workspace.state),
    state: workspace.state,
  };
}
