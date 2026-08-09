"use client";

import { useState } from "react";

const VERIFICATION_CHECKS = [
  "Identity record authentic",
  "Lifecycle status active",
  "Signing key acceptable",
  "Proposed action within declared scope",
] as const;

export function AinPassport() {
  const fullAin = "ain:0000000000000000000000000042EXAMPLEabcdefghijkl";
  const truncated = `${fullAin.slice(0, 28)}…`;
  const [copied, setCopied] = useState(false);

  async function copyAin() {
    try {
      await navigator.clipboard.writeText(fullAin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access may be unavailable in some environments.
    }
  }

  return (
    <div className="mx-auto mt-10 grid w-full max-w-4xl grid-cols-1 gap-6 rounded-[18px] bg-white/60 p-6 shadow-[0_40px_80px_-40px_rgba(9,17,38,0.08)] md:grid-cols-3">
      <div className="col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--secondary)]">
          Agent accountability passport
        </h3>

        <div className="mt-4 rounded-[14px] border border-[#E8ECEF] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#091126]">Agent</p>
              <p className="mt-1 text-base font-medium text-slate-700">
                Payments Operations Agent
              </p>

              <div className="mt-4 text-sm text-slate-600">
                <p className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">
                    Permanent AIN
                  </span>
                  <button
                    onClick={copyAin}
                    className="ml-auto inline-flex items-center gap-2 rounded-[10px] border px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    aria-label="Copy full AIN to clipboard"
                  >
                    <span className="font-mono text-sm">{truncated}</span>
                    <span className="text-xs text-slate-400">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="font-semibold">Active</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Document version</p>
                    <p className="font-semibold">v3</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Signature</p>
                    <p className="font-semibold">EdDSA</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Key ID</p>
                    <p className="font-mono text-sm">key:ABCD-1234-EXAMPLE</p>
                  </div>
                  <div className="col-span-2 mt-2">
                    <p className="text-xs text-slate-500">Accountable owner</p>
                    <p className="font-semibold text-slate-700">
                      Designated operations lead
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">Last verified</p>
                    <p className="text-sm text-slate-600">
                      2026-07-24 · 12:34 UTC
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-slate-500">Scope</p>
                  <ul className="mt-2 grid gap-1 text-sm text-slate-700">
                    <li className="inline-flex items-center gap-3 rounded-[8px] border border-[#EEF2F4] bg-[#FBFDFF] px-3 py-1">
                      payments.initiate
                    </li>
                    <li className="inline-flex items-center gap-3 rounded-[8px] border border-[#EEF2F4] bg-[#FBFDFF] px-3 py-1">
                      customer_comms.send
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[12px] border border-[#E8ECEF] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
            Verification
          </p>
          <div
            className="hero-passport-verification mt-3 space-y-2 text-sm text-slate-700"
            data-testid="hero-passport-verification"
          >
            {VERIFICATION_CHECKS.map((check) => (
              <div
                key={check}
                className="hero-passport-check flex items-center justify-between gap-3"
              >
                <span>{check}</span>
                <span className="hero-passport-check-result text-sm font-semibold text-green-600">
                  <span className="hero-passport-check-tick" aria-hidden="true">
                    ✓
                  </span>
                  Yes
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E8ECEF] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--secondary)]">
            Receipt chain
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between">
              Sequence 41 <span className="text-slate-500">↳</span>
            </li>
            <li className="flex items-center justify-between">
              Sequence 42 <span className="text-slate-500">↳</span>
            </li>
            <li className="flex items-center justify-between">
              Sequence 43 <span className="text-slate-500">↳</span>
            </li>
          </ul>
        </div>

        <p className="mt-1 text-xs text-slate-500">Illustrative demo data</p>
      </aside>
    </div>
  );
}
