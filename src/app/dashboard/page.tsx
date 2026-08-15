import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";
import { initialAccountWorkspaceState } from "@/lib/account-workspace";

// Reads the session per request; never prerendered at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  // Fail closed independently of middleware — never render the authenticated
  // shell to an anonymous request.
  if (!session?.user) redirect("/");
  return (
    <DashboardView
      email={session.user.email}
      state={initialAccountWorkspaceState}
    />
  );
}
