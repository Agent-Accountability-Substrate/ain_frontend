import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AgentCreationView } from "@/components/agent-creation-view";

export const dynamic = "force-dynamic";

export default async function AgentCreationPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return <AgentCreationView email={session.user.email} />;
}
