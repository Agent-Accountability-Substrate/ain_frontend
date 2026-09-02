"use client";

import Link from "next/link";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A dropdown menu that behaves like one: `role="menu"`, arrow-key and Home/End
 * movement, typeahead, Escape, outside-press dismissal, focus return to the
 * trigger, and `aria-haspopup`.
 *
 * `modal={false}` is load-bearing. Base UI defaults it to `true`, which locks
 * document scroll and disables pointer interaction outside the popup — dialog
 * behaviour, which a command-bar menu should not have. Deleting this prop as
 * noise would silently reintroduce it.
 */

export const POPUP_CLASS =
  "z-[60] min-w-56 rounded-2xl border border-line-strong bg-white p-2 shadow-[0_24px_50px_-24px_rgba(9,17,38,0.45),0_1px_0_rgba(255,255,255,0.9)_inset] origin-[var(--transform-origin)] transition-[opacity,transform] duration-(--dur-hover) data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 motion-reduce:transition-none";

export function Menu({
  trigger,
  triggerClassName,
  triggerLabel,
  children,
  align = "end",
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  /**
   * The trigger's accessible name, when its visible content cannot supply one
   * at every width. It must still *contain* the visible text label, or it
   * breaks Label in Name (WCAG 2.5.3) — the failure this component was written
   * to fix.
   */
  triggerLabel?: string;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  return (
    <BaseMenu.Root modal={false}>
      <BaseMenu.Trigger
        aria-label={triggerLabel}
        className={cn(
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
          triggerClassName,
        )}
      >
        {trigger}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        {/* The z-index belongs on the Positioner: the portal element is
            statically positioned, so z-index does not apply to it. */}
        <BaseMenu.Positioner align={align} sideOffset={8} className="z-[60]">
          <BaseMenu.Popup className={POPUP_CLASS}>{children}</BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

const ITEM_CLASS =
  "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-ink-soft data-[highlighted]:bg-wash-blue data-[highlighted]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:text-mist-light";

export function MenuItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.Item>) {
  return <BaseMenu.Item className={cn(ITEM_CLASS, className)} {...props} />;
}

export function MenuLinkItem({
  className,
  href = "#",
  closeOnClick = true,
  ...props
}: ComponentPropsWithoutRef<typeof BaseMenu.LinkItem> & { href?: string }) {
  // `render` makes this a `next/link`, so choosing from a menu is a client
  // transition and the shell around it stays mounted. Base UI defaults
  // `closeOnClick` to false on a LinkItem, which is correct for a plain anchor
  // that replaces the document and takes the popup with it — here the document
  // survives, so the menu must be told to close.
  return (
    <BaseMenu.LinkItem
      className={cn(ITEM_CLASS, className)}
      closeOnClick={closeOnClick}
      render={<Link href={href} />}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="my-1.5 h-px bg-line" />;
}

/**
 * A labelled group of items.
 *
 * The label has to live inside a `Menu.Group` — `Menu.GroupLabel` throws
 * "MenuGroupContext is missing" otherwise, which typechecks fine and fails at
 * runtime. Pairing them in one component is what stops that being rediscovered.
 * It is also the semantic point: the label names the group for assistive
 * technology rather than floating above it as decoration.
 */
export function MenuGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <BaseMenu.Group>
      <BaseMenu.GroupLabel className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </BaseMenu.GroupLabel>
      {children}
    </BaseMenu.Group>
  );
}

export { BaseMenu };
