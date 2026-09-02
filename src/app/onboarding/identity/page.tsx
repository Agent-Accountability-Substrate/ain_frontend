import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { IdentityOnboardingView } from "@/domains/identity/identity-onboarding-view";

export const dynamic = "force-dynamic";

export default async function IdentityOnboardingPage() {
  const session = await auth();

  if (!session?.user) redirect("/");

  return (
    <IdentityOnboardingView
      email={session.user.email}
      name={session.user.name}
    />
  );
}
