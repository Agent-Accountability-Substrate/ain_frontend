import type { ButtonHTMLAttributes } from "react";
import { signInAction } from "@/lib/auth-actions";

type SignInButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function SignInButton({ className, ...props }: SignInButtonProps) {
  return (
    <form action={signInAction}>
      <button
        type="submit"
        className={`inline-flex items-center justify-center rounded-[12px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#091126]/20 transition hover:bg-slate-900 ${className ?? ""}`}
        {...props}
      >
        Sign in
      </button>
    </form>
  );
}
