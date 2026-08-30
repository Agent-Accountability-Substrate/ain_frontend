import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AgentDemoView } from "@/domains/agents/agent-demo-view";

export const dynamic = "force-dynamic";

export default async function AgentDemoPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return <AgentDemoView />;
}
