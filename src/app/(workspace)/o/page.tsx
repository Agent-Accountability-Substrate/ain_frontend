import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { loadWorkspace } from "@/domains/workspace/workspace-page";
import {
  landingHref,
  NEW_ORGANISATION,
  orgHref,
  selectedOrganisation,
} from "@/domains/workspace/workspace-routes";

/**
 * The workspace root, which resolves rather than renders.
 *
 * An address with no organisation in it cannot show a workspace, because a
 * workspace acts for one organisation. What it can do is work out which, and
 * that is all this does: one membership goes straight in, several go to the
 * list, none goes to the only thing that can be done next.
 */
export const dynamic = "force-dynamic";

export default async function WorkspaceRootPage() {
  const session = await auth();
  if (!session?.user) return redirect("/");

  const workspace = await loadWorkspace(null);
  // The registry being down means the membership list is unknown, so there is
  // no organisation to resolve to. The create page renders the outage properly.
  if (workspace.status === "unavailable") return redirect(NEW_ORGANISATION);

  // The loader has already resolved the last switch against the memberships,
  // so this is "where you were" rather than "the first one on the list".
  const last = selectedOrganisation(workspace.state);
  return redirect(
    last ? orgHref(last.ulid) : landingHref(workspace.state.organisations),
  );
}
