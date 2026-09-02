import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** The "there is nothing here yet, and here is what to do" panel. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-band/60 px-6 py-10 text-center",
        className,
      )}
    >
      <Icon className="h-6 w-6 text-mist" aria-hidden="true" />
      {title ? (
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      ) : null}
      {children ? (
        <p className="max-w-prose text-xs leading-5 text-mist">{children}</p>
      ) : null}
      {action}
    </div>
  );
}
