import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import { SETTINGS } from "@/domains/workspace/workspace-routes";
import { PageHeading } from "@/lib/ui/page-heading";

/**
 * The frame every settings page shares.
 *
 * The shell around it does not change: opening settings must not read as
 * having left the company you were working in.
 *
 * No second rail either — the workspace already has one, and a settings tree
 * beside it would be two navigations competing for the same corner. The way
 * back up is the kicker above the title.
 */
export function SettingsLayout({
  currentPath,
  title,
  lede,
  children,
}: {
  currentPath: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  const isDoor = currentPath === SETTINGS;

  return (
    <>
      <WorkspaceContent columns="single">
        <WorkspacePane className="mx-auto flex w-[min(100%,58rem)] flex-col gap-5">
          {/* The kicker every screen carries, doing a second job here: on a
            settings sub-page it is the way back up. */}
          {isDoor ? null : (
            <Link
              href={SETTINGS}
              // The gear in the bar is also called Settings and goes to the
              // same place. Two identical names in one document is a coin toss
              // for anyone navigating by name; this one still contains the
              // visible word, so Label in Name holds.
              aria-label="Back to settings"
              className="group -ml-1 inline-flex w-fit items-center gap-1.5 rounded-lg px-1 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-light transition-colors duration-(--dur-hover) hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ChevronLeft
                className="h-3 w-3 transition-transform duration-(--dur-hover) group-hover:-translate-x-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
              Settings
            </Link>
          )}

          <PageHeading lede={lede}>{title}</PageHeading>
          {children}
        </WorkspacePane>
      </WorkspaceContent>
    </>
  );
}
