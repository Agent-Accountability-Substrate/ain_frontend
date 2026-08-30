import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The content region inside the shell.
 *
 * Owns the one thing every screen shares and nothing else: the grid, and the
 * scroll that pairs with the shell's fixed frame. `columns` is the only knob
 * because the four historical layouts differed in exactly that.
 */
export function WorkspaceContent({
  columns = "sidebar",
  className,
  children,
}: {
  columns?: "sidebar" | "overview" | "single";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid flex-1 gap-5 px-5 py-5 handheld:gap-4 handheld:px-4 handheld:py-4",
        // `min-h-0` is load-bearing: a flex item keeps `min-height:auto` and
        // refuses to shrink, so the shell's `overflow:hidden` could never
        // constrain this and it would push the frame open instead of scrolling.
        "min-h-0 overflow-y-auto [overscroll-behavior:contain]",
        columns === "overview" &&
          "grid-cols-[minmax(0,1fr)] items-start gap-10 xl:grid-cols-[17rem_minmax(30rem,1fr)_21rem]",
        columns === "sidebar" &&
          "grid-cols-[minmax(0,1fr)] items-start lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]",
        columns === "single" && "grid-cols-[minmax(0,1fr)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A column inside the content region.
 *
 * It does not scroll on its own. One scroller for the middle beats three: a
 * screen with a sidebar, a body and an aside would otherwise hand you three
 * scrollbars and no way to know which one a keystroke moves.
 */
export function WorkspacePane({
  as: Tag = "div",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "aside" | "nav" | "section";
}) {
  return (
    <Tag {...props} className={cn("min-w-0", className)}>
      {children}
    </Tag>
  );
}
