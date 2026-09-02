import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The workspace's one button.
 *
 * Variants are a plain record rather than `cva`: there are three of them, the
 * repo's convention is an `as const` set with the type derived from it, and a
 * variant library earns its keep at compound variants and slots, neither of
 * which exists here.
 *
 * `Button` renders a `<button>` and `ButtonLink` an `<a>`, because the two are
 * not interchangeable — a link that submits a form and a button that navigates
 * are both bugs, and keeping them separate makes choosing wrong deliberate.
 */

const VARIANTS = {
  primary:
    "border-ink bg-ink text-white hover:bg-ink/90 disabled:border-line-strong disabled:bg-line-soft disabled:text-mist",
  secondary:
    "border-line-strong bg-white text-ink hover:border-ink/30 hover:bg-band disabled:text-mist",
  ghost: "border-transparent bg-transparent text-cobalt hover:bg-wash-blue",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Shared so a link and a button of the same variant are pixel-identical. */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors duration-(--dur-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed";

/** The variant's classes, for the rare control that cannot be either of these. */
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], className);
}

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  // `type` defaults to "button", not the platform's "submit". The module's own
  // rule above — a button that navigates is a bug — has the same shape here: a
  // control added to a form without a type silently becomes a submit, and the
  // two-step organisation form is one `type` attribute away from posting step
  // one with no address in it.
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "secondary",
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <a className={cn(BASE, VARIANTS[variant], className)} {...props}>
      {children}
    </a>
  );
}
