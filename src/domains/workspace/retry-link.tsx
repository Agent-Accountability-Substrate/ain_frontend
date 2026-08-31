"use client";

import { usePathname } from "next/navigation";

import { buttonClassName } from "@/lib/ui/button";

/**
 * "Try again" on a screen that was server-rendered from a failed read.
 *
 * A plain `<a>`, deliberately, and to the path that actually failed. Both
 * halves matter and both were lost when this became a `ButtonLink` to `/o`:
 * `ButtonLink` is `next/link`, so the retry became a client transition inside
 * the very layout segment that is rendering this instead of its children —
 * and `/o` is not where the caller was, so a member whose settings page failed
 * was sent somewhere else entirely, or onward to the register-a-company form.
 *
 * The path comes from the client because a layout cannot read it on the
 * server; the browser has always known it.
 */
export function RetryLink({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <a href={pathname} className={buttonClassName("primary")}>
      {children}
    </a>
  );
}
