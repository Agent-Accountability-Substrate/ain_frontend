import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const INPUT =
  "mt-[9px] w-full rounded-[10px] border border-site-rule bg-white/[0.62] px-[15px] py-[13px] font-site-sans text-[15px] text-site-ink transition-[border-color,background-color,box-shadow] duration-[180ms] ease-[ease] outline-none placeholder:text-site-muted hover:border-site-ink/[0.24] focus:border-site-ink focus:bg-white focus:shadow-[0_1px_2px_rgba(22,24,28,0.06)]";

const LABEL =
  "font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-muted select-none";

/**
 * One labelled input. `trailing` is the "Forgot your password?" slot — it sits
 * on the label's baseline rather than under the field, so the label row reads
 * as one line.
 */
export function AuthField({
  id,
  name,
  type,
  label,
  placeholder,
  autoComplete,
  required = true,
  hint,
  trailing,
}: {
  id: string;
  name: string;
  type: "text" | "email" | "password";
  label: string;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
  hint?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mt-5">
      {trailing ? (
        <div className="flex items-baseline justify-between gap-3.5">
          <label className={LABEL} htmlFor={id}>
            {label}
          </label>
          {trailing}
        </div>
      ) : (
        <label className={cn(LABEL, "block")} htmlFor={id}>
          {label}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={INPUT}
      />
      {hint ? (
        <p className="mt-2 text-[12.5px] leading-[1.5] text-site-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** The card's one primary action. `accent` is the sign-up's orange. */
export function AuthSubmit({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      type="submit"
      className={cn(
        "mt-[26px] inline-flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 px-5 py-3.5 font-site-sans text-[15px] font-medium transition-colors duration-[180ms] ease-[ease] select-none",
        accent
          ? "bg-site-accent text-[#1b0e04] hover:bg-[#ff9552]"
          : "bg-site-ink text-site-paper hover:bg-[#2a2c33]",
      )}
    >
      {children}
    </button>
  );
}

/** A checkbox and its sentence, the whole row clickable. */
export function AuthCheck({
  name,
  required = false,
  children,
}: {
  name: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="mt-[18px] flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-site-ink-soft select-none">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-0.5 h-[15px] w-[15px] flex-none cursor-pointer accent-site-ink"
      />
      <span>{children}</span>
    </label>
  );
}

/**
 * The "or" rule and the two other ways in.
 *
 * Passkey and SSO are drawn but not yet built, so they are `type="button"` and
 * do nothing — the same state as the rest of these pages until the identity
 * provider question is settled.
 */
export function AuthAlternatives() {
  return (
    <>
      <div className="mt-[26px] flex items-center gap-3.5 font-site-mono text-[10px] uppercase tracking-[0.14em] text-site-muted select-none before:h-px before:flex-1 before:bg-site-rule before:content-[''] after:h-px after:flex-1 after:bg-site-rule after:content-['']">
        or
      </div>
      <div className="mt-[18px] grid grid-cols-2 gap-2.5">
        {["Passkey", "SSO"].map((label) => (
          <button
            key={label}
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-site-rule bg-transparent px-3.5 py-3 font-site-sans text-[14px] text-site-ink transition-[border-color,background-color] duration-[180ms] ease-[ease] select-none hover:border-site-ink hover:bg-site-ink/[0.04]"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

export function AuthLegal({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-[30px] max-w-[30rem] text-center font-site-mono text-[10px] leading-[1.7] text-site-muted">
      {children}
    </p>
  );
}
