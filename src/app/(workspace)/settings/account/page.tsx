import { AccountSecurityView } from "@/domains/identity/account-security-view";
import { loadAccountPage } from "@/domains/workspace/account-page";

export const dynamic = "force-dynamic";

/**
 * The person's own settings.
 *
 * No organisation in the address, because none owns this: the details, the
 * sign-in and the identity check are the same whichever company the account is
 * acting for.
 */
export default async function AccountSettingsPage() {
  const page = await loadAccountPage();
  if (page.status !== "ready") return null;

  return (
    <AccountSecurityView
      email={page.email}
      name={page.name}
      state={page.state}
    />
  );
}
