import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard-view";

// Reads the session per request; never prerendered at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  return <DashboardView email={session?.user?.email} />;
}
