"use client";

import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { POPUP_CLASS } from "@/lib/ui/menu";

/**
 * A disclosure panel anchored to its trigger.
 *
 * Distinct from `Menu` on purpose. A menu is a list of commands and its
 * contents are `menuitem`s; the notifications panel is headings and prose, and
 * putting that inside `role="menu"` describes it to assistive technology as
 * something it is not. The old markup used one `<details>` for both, which is
 * how they came to look interchangeable.
 *
 * `Popover` already defaults to `modal={false}`; it is passed explicitly so the
 * three popups in this codebase read the same way and none of them is one
 * upstream default change away from scroll-locking the page.
 */
export function Popover({
  trigger,
  triggerClassName,
  title,
  children,
  align = "end",
  className,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  /** Names the panel, so it is not an anonymous region. */
  title: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <BasePopover.Root modal={false}>
      <BasePopover.Trigger
        className={cn(
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          triggerClassName,
        )}
      >
        {trigger}
      </BasePopover.Trigger>
      <BasePopover.Portal>
        <BasePopover.Positioner align={align} sideOffset={8} className="z-[60]">
          <BasePopover.Popup className={cn(POPUP_CLASS, "w-80 p-0", className)}>
            <BasePopover.Title className="sr-only">{title}</BasePopover.Title>
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
