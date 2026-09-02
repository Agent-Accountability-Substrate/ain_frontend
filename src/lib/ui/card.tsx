import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

/**
 * The white rounded panel every workspace surface is built from.
 *
 * `as` exists because the same box is a `<section>`, an `<article>` and an
 * `<aside>` depending on what it holds, and hard-coding a `<div>` would make
 * the document outline worse in exchange for a simpler prop list.
 */
export function Card({
  as: Tag = "div",
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & { as?: ElementType }) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-line bg-white/95 p-5 shadow-[0_16px_36px_-34px_rgba(9,17,38,0.6)]",
        className,
      )}
      {...props}
    />
  );
}
