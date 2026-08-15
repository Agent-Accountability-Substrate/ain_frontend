import { ChevronDown, LockKeyhole, UserRound } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";

export function UserAccountMenu({
  email,
}: {
  email: string | null | undefined;
}) {
  const accountEmail = email ?? "unknown";
  const accountInitial =
    accountEmail === "unknown" ? "A" : accountEmail.charAt(0).toUpperCase();

  return (
    <details className="user-account-menu">
      <summary aria-label={`Open account menu for ${accountEmail}`}>
        <span className="user-account-avatar">{accountInitial}</span>
        <span className="user-account-email">{accountEmail}</span>
        <ChevronDown
          className="user-account-chevron h-3.5 w-3.5"
          aria-hidden="true"
        />
      </summary>

      <div className="user-account-popover">
        <p className="dashboard-eyebrow">Account</p>
        <div className="user-account-profile-item" aria-disabled="true">
          <span className="user-account-item-icon">
            <UserRound className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <strong>Profile &amp; account management</strong>
            <small>Available when account settings are connected</small>
          </span>
          <LockKeyhole
            className="ml-auto h-3.5 w-3.5 text-mist-light"
            aria-hidden="true"
          />
        </div>

        <div className="user-account-signout">
          <SignOutButton />
        </div>
      </div>
    </details>
  );
}
