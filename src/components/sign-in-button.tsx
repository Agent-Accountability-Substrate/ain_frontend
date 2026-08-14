import type { ButtonHTMLAttributes } from "react";
import { signInAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type SignInButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function SignInButton({
  className,
  children,
  ...props
}: SignInButtonProps) {
  return (
    <form action={signInAction}>
      <button
        type="submit"
        // cn(), not concatenation: a caller passing px-3 against the base
        // px-5 ships both classes, and the stylesheet's order picks the
        // winner rather than the caller.
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-ink/20 transition hover:bg-slate-900",
          className,
        )}
        {...props}
      >
        {children ?? "Sign in"}
      </button>
    </form>
  );
}
