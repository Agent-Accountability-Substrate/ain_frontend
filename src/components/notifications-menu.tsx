import { Bell, CircleCheck, Fingerprint } from "lucide-react";

export function NotificationsMenu({
  context,
}: {
  context: "onboarding" | "workspace";
}) {
  const isOnboarding = context === "onboarding";

  return (
    <details className="notifications-menu">
      <summary aria-label="Open notifications">
        <Bell className="h-4 w-4" aria-hidden="true" />
        {isOnboarding ? (
          <span className="notifications-unread-mark" aria-hidden="true" />
        ) : null}
      </summary>

      <div className="notifications-popover">
        <header>
          <div>
            <p className="dashboard-eyebrow">Updates</p>
            <h2>Notifications</h2>
          </div>
          {isOnboarding ? <span>1 new</span> : null}
        </header>

        {isOnboarding ? (
          <article className="notifications-item">
            <span className="notifications-item-icon">
              <Fingerprint className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3>Identity verification not started</h3>
              <p>
                Complete individual due diligence before beginning an
                organisation registration.
              </p>
              <small>Account setup</small>
            </div>
          </article>
        ) : (
          <div className="notifications-empty">
            <CircleCheck className="h-5 w-5" aria-hidden="true" />
            <div>
              <h3>You are up to date</h3>
              <p>No new workspace notifications.</p>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
