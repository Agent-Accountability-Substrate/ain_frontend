"use client";

import { useActionState } from "react";

import {
  type AccessRequestState,
  requestAccessAction,
} from "@/lib/access-request";

const INITIAL: AccessRequestState = { status: "idle" };

// A server action on a real <form>, so the ask posts and works with
// JavaScript disabled or still downloading. `useActionState` layers the
// pending and confirmation states on top once hydration lands.
export function LandingAccessForm() {
  const [state, formAction, pending] = useActionState(
    requestAccessAction,
    INITIAL,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
      <div>
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.12em] text-secondary">
          Access
        </p>
        <p className="mt-4 max-w-[24ch] text-balance text-[22px] font-normal leading-[1.2] tracking-[-0.02em] text-ink sm:text-[26px]">
          Subra is in private preview with regulated firms.
        </p>
        <p className="mt-3 max-w-[46ch] text-sm leading-6 text-slate-600">
          We are working with a small number of firms deploying agents into
          regulated processes. If that is you, tell us where accountability
          currently lives.
        </p>
      </div>

      <div className="h-fit">
        {state.status === "sent" ? (
          <p className="flex items-start gap-3 font-mono text-[13px] leading-6 text-ink">
            <span
              aria-hidden="true"
              className="mt-1.5 h-2 w-2 shrink-0 bg-secondary"
            />
            Received. We will reply from a named person at Subra, usually within
            two working days.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <label
              htmlFor="access-email"
              className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-ink-muted"
            >
              Work email
            </label>
            <input
              id="access-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@firm.co.uk"
              aria-describedby={
                state.status === "error" ? "access-error" : undefined
              }
              className="border-0 border-b border-line-strong bg-transparent py-2.5 font-mono text-[14px] leading-[1.4] text-ink outline-none transition-colors placeholder:text-mist-light focus:border-secondary focus-visible:ring-0"
            />

            {/* Off-screen rather than display:none — a crawler that skips
                hidden fields would skip the trap too. Never announced, never
                tabbable, never autofilled. */}
            <input
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
            />

            {state.status === "error" ? (
              <p
                id="access-error"
                role="alert"
                className="text-[13px] leading-5 text-destructive"
              >
                {state.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 self-start rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Sending…" : "Request access"}
            </button>
          </form>
        )}

        <p className="mt-6 font-mono text-[11px] leading-[1.6] text-steel">
          Subra is not regulatory advice and is not endorsed by or affiliated
          with any regulator.
        </p>
      </div>
    </div>
  );
}
