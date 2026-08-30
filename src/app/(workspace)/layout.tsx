import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { WorkspaceShell } from "@/domains/workspace/workspace-shell";
import { WorkspaceUnavailable } from "@/domains/workspace/workspace-unavailable";
import { loadWorkspace } from "@/domains/workspace/workspace-page";

/**
 * Everything behind the sign-in, framed once.
 *
 * The bar and the rail live here rather than inside each screen, which is the
 * whole point: a layout is not re-rendered by a navigation beneath it, so they
 * are mounted once and stay mounted while the middle changes. The pages below
 * render their content and nothing else.
 *
 * The registry read is shared with the page under it — `loadAccountWorkspace`
 * memoises the fetch per request — so framing every screen costs no extra
 * round trip.
 */
export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const workspace = await loadWorkspace(null);
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        detail={workspace.detail}
        email={session.user.email}
      />
    );
  }

  return (
    <WorkspaceShell
      assuranceStatus={workspace.state.individualAssurance.status}
      email={session.user.email}
      isOperator={workspace.state.isOperator}
      organisations={workspace.state.organisations}
      selectedOrganisationId={workspace.state.selectedOrganisationId}
    >
      {children}
    </WorkspaceShell>
  );
}
