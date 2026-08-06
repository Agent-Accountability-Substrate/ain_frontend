import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AgentDemoView } from "@/components/agent-demo-view";

export const dynamic = "force-dynamic";

export default async function AgentDemoPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return <AgentDemoView email={session.user.email} />;
}
