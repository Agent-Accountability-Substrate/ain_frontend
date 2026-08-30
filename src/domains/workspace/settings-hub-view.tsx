import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SettingsLayout } from "@/domains/workspace/settings-layout";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import { settingsGroupsFor } from "@/domains/workspace/workspace-navigation";
import { SETTINGS } from "@/domains/workspace/workspace-routes";
import { Card } from "@/lib/ui/card";

/**
 * The settings door.
 *
 * Two groups — the account's, and the company's under its own name. Someone
 * wanting to add a colleague does not know whether "members" is a property of
 * their account or of the company; they know they want to add someone.
 */
export function SettingsHubView({
  organisation,
}: {
  organisation: OrganisationSummary | null;
}) {
  return (
    <SettingsLayout
      currentPath={SETTINGS}
      title="Settings"
      lede="Your account, and the company you are acting for."
    >
      <div className="flex flex-col gap-6">
        {settingsGroupsFor(organisation).map((group) => (
          <section key={group.label} className="flex flex-col gap-2.5">
            <h2 className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-mist-light">
              {group.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <Card key={item.href} as={Link} href={item.href} interactive>
                  <div className="flex items-start gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-sm font-semibold text-ink">
                        {item.label}
                      </p>
                      <p className="text-[11px] leading-4 text-mist">
                        {item.detail}
                      </p>
                    </div>
                    <ArrowRight
                      className="ml-auto h-4 w-4 shrink-0 text-mist"
                      aria-hidden="true"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SettingsLayout>
  );
}
