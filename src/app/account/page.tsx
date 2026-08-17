import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountSecurityView } from "@/components/account-security-view";
import { WorkspaceUnavailable } from "@/components/workspace-unavailable";
import { loadWorkspace } from "@/lib/workspace-page";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) redirect("/");

  // The selection lives in the URL, so this page has to read it. Rendering the
  // switcher while ignoring `?org=` made the control snap back to "Select an
  // organisation" the moment it was used -- multi-organisation membership is
  // the headline capability here, and it was unusable from the page a user
  // lands on first.
  const selected = (await searchParams)["org"];
  const workspace = await loadWorkspace(
    typeof selected === "string" ? selected : null,
  );
  if (workspace.status === "unavailable") {
    return (
      <WorkspaceUnavailable
        currentPath="/account"
        detail={workspace.detail}
        email={session.user.email}
        workspaceLabel="Account & Security"
      />
    );
  }

  return (
    <AccountSecurityView
      email={session.user.email}
      name={session.user.name}
      state={workspace.state}
    />
  );
}
