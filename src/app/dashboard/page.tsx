import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";
import { loadAccountWorkspace } from "@/lib/registry-api";

// Reads the session and the registry per request; never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  // Fail closed independently of middleware — never render the authenticated
  // shell to an anonymous request.
  if (!session?.user) redirect("/");
  return (
    <DashboardView
      email={session.user.email}
      state={await loadAccountWorkspace()}
    />
  );
}
