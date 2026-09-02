"use client";

import { Bell, CircleCheck, Fingerprint } from "lucide-react";

import { Eyebrow } from "@/lib/ui/eyebrow";
import { Popover } from "@/lib/ui/popover";

/**
 * Workspace notifications.
 *
 * A popover rather than a menu: its contents are headings and prose, not
 * commands. The previous `<details>` served both this and the account menu,
 * which is how two different things came to look like one.
 *
 * The unread state is in the trigger's accessible name, not only in a dot. The
 * dot was `aria-hidden`, and the text explaining it lived inside a closed
 * `<details>` — which is not in the accessibility tree — so there was no way to
 * learn an unread notification existed without opening the panel to find out.
 */
export function NotificationsMenu({
  context,
}: {
  context: "onboarding" | "workspace";
}) {
  const unread = context === "onboarding" ? 1 : 0;

  return (
    <Popover
      title="Notifications"
      triggerClassName="relative flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-muted hover:border-ink/20"
      trigger={
        <>
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unread > 0 ? (
            <span
              className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warm-500"
              aria-hidden="true"
            />
          ) : null}
          <span className="sr-only">
            {unread > 0
              ? `Notifications, ${unread} unread`
              : "Notifications, none unread"}
          </span>
        </>
      }
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <Eyebrow>Updates</Eyebrow>
          <p className="mt-0.5 text-sm font-semibold text-ink">Notifications</p>
        </div>
        {unread > 0 ? (
          <span className="rounded-full bg-wash-blue px-2 py-0.5 text-[11px] font-semibold text-cobalt">
            {unread} new
          </span>
        ) : null}
      </header>

      {unread > 0 ? (
        <article className="flex gap-3 px-4 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-wash text-warm-700">
            <Fingerprint className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-xs font-semibold text-ink">
              Identity verification not started
            </h3>
            <p className="text-[11px] leading-4 text-mist">
              Complete individual due diligence before beginning an organisation
              registration.
            </p>
            <small className="text-[10px] font-semibold text-mist-light">
              Account setup
            </small>
          </div>
        </article>
      ) : (
        <div className="flex items-center gap-3 px-4 py-5">
          <CircleCheck
            className="h-5 w-5 text-success-strong"
            aria-hidden="true"
          />
          <div>
            <h3 className="text-xs font-semibold text-ink">
              You are up to date
            </h3>
            <p className="text-[11px] text-mist">
              No new workspace notifications.
            </p>
          </div>
        </div>
      )}
    </Popover>
  );
}
