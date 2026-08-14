import type { ButtonHTMLAttributes } from "react";
import { signInAction } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type SignInButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function SignInButton({ className, ...props }: SignInButtonProps) {
  return (
    <form action={signInAction}>
      <button
        type="submit"
        className={cn(
          "inline-flex items-center justify-center rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-ink/20 transition hover:bg-slate-900",
          className,
        )}
        {...props}
      >
        Sign in
      </button>
    </form>
  );
}
