import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountSecurityView } from "@/components/account-security-view";
import { initialAccountWorkspaceState } from "@/lib/account-workspace";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <AccountSecurityView
      email={session.user.email}
      name={session.user.name}
      state={initialAccountWorkspaceState}
    />
  );
}
