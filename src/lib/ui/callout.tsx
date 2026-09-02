import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A bordered note that carries a tone.
 *
 * The tone is the point: `caution` and `danger` are the difference between
 * "here is context" and "this went wrong", and the workspace had been writing
 * all three by hand, one colour triple at a time. Setting `alert` announces the
 * note to assistive tech — right for something that appeared in response to an
 * action, wrong for standing guidance that was always on the page.
 */

const TONE = {
  info: "border-frost bg-wash-blue text-ink-muted",
  caution: "border-warm-600/30 bg-warm-wash text-warm-800",
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
} as const;

export type CalloutTone = keyof typeof TONE;

export function Callout({
  tone = "info",
  icon: Icon,
  title,
  alert = false,
  className,
  children,
}: {
  tone?: CalloutTone;
  icon?: LucideIcon;
  title?: ReactNode;
  alert?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={alert ? "alert" : undefined}
      className={cn(
        "rounded-xl border p-3 text-[11px] leading-5",
        TONE[tone],
        Icon && "flex items-start gap-3",
        className,
      )}
    >
      {Icon ? (
        <Icon className="mt-px h-5 w-5 shrink-0" aria-hidden="true" />
      ) : null}
      {title ? (
        <div className="flex flex-col gap-1">
          <strong className="text-xs font-semibold">{title}</strong>
          <p>{children}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
