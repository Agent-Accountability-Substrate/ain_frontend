import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountSecurityView } from "@/components/account-security-view";
import { WorkspaceUnavailable } from "@/components/workspace-unavailable";
import { loadWorkspace } from "@/lib/workspace-page";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  const workspace = await loadWorkspace();
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
