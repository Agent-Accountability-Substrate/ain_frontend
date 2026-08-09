import { CheckCircle2, Fingerprint, Link2 } from "lucide-react";

import { CopyableAin } from "@/components/copyable-ain";

const PERMANENT_AIN =
  "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ";
const DISPLAY_AIN = "did:ain:gb:01ARZ3N…EMMVRZ";

const PASSPORT_DETAILS = [
  ["Document version", "v3"],
  ["Signature", "EdDSA"],
  ["Key ID", "key-demo-7F3A91C2"],
  ["Accountable owner", "Payments Operations"],
  ["Last verified", "23 Jul 2026, 11:42 BST"],
] as const;

const SCOPE = ["payments.initiate", "customer_comms.send"] as const;

const VERIFICATION_CHECKS = [
  "Identity record authentic",
  "Lifecycle status active",
  "Signing key acceptable",
  "Proposed action within declared scope",
] as const;

const RECEIPT_SEQUENCES = [41, 42, 43] as const;

export function AgentPassportDemo() {
  return (
    <section
      aria-labelledby="agent-passport-title"
      className="mx-auto mt-14 max-w-6xl sm:mt-16"
    >
      <div className="overflow-hidden rounded-[28px] border border-[#D8DDE8] bg-white shadow-[0_28px_70px_-44px_rgba(9,17,38,0.4)]">
        <header className="flex flex-col gap-4 border-b border-[#E4E6ED] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF0F7] text-[#4D6FAD]">
              <Fingerprint className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#4D6FAD]">
                Registered agent record
              </p>
              <h2
                id="agent-passport-title"
                className="mt-1 text-xl font-semibold tracking-tight text-[#091126] sm:text-2xl"
              >
                Agent accountability passport
              </h2>
            </div>
          </div>
          <p className="inline-flex w-fit items-center rounded-full border border-[#D8DDE8] bg-[#F7FAFF] px-3 py-1.5 text-xs font-semibold text-slate-600">
            Illustrative demo data
          </p>
        </header>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <div className="min-w-0 rounded-[20px] border border-[#E4E6ED] bg-[#FBFCFF] p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#E4E6ED] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Agent
                </p>
                <p className="mt-2 text-lg font-semibold text-[#091126]">
                  Payments Operations Agent
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#EAF7F0] px-3 py-1.5 text-xs font-semibold text-[#16794A]">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#16794A]"
                  aria-hidden="true"
                />
                Active
              </span>
            </div>

            <div className="border-b border-[#E4E6ED] py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Permanent AIN
              </p>
              <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-[#E4E6ED] bg-white p-2 pl-3">
                <code
                  className="min-w-0 flex-1 truncate text-sm text-[#091126]"
                  title={PERMANENT_AIN}
                >
                  <span className="sr-only">{PERMANENT_AIN}</span>
                  <span aria-hidden="true">{DISPLAY_AIN}</span>
                </code>
                <CopyableAin value={PERMANENT_AIN} />
              </div>
            </div>

            <dl className="grid gap-x-6 gap-y-5 py-5 sm:grid-cols-2">
              {PASSPORT_DETAILS.map(([label, value]) => (
                <div
                  key={label}
                  className={
                    label === "Last verified" ? "sm:col-span-2" : undefined
                  }
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </dt>
                  <dd
                    className={
                      label === "Key ID"
                        ? "mt-2 font-mono text-sm text-[#091126]"
                        : "mt-2 text-sm font-semibold text-[#091126]"
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-[#E4E6ED] pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Scope
              </p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Agent scope">
                {SCOPE.map((permission) => (
                  <li
                    key={permission}
                    className="rounded-lg border border-[#D8DDE8] bg-white px-3 py-2 font-mono text-xs font-medium text-[#4D6FAD]"
                  >
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside
            aria-labelledby="verification-title"
            className="rounded-[20px] border border-[#D8DDE8] bg-[#091126] p-5 text-white sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#AFC0E2]">
              Verification
            </p>
            <h3
              id="verification-title"
              className="mt-2 text-lg font-semibold tracking-tight"
            >
              Record checks
            </h3>
            <ul className="mt-5 divide-y divide-white/10">
              {VERIFICATION_CHECKS.map((check) => (
                <li key={check} className="flex items-start gap-3 py-4 first:pt-0">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#74D6A2]"
                    aria-hidden="true"
                  />
                  <span className="text-sm leading-6 text-slate-100">
                    {check}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="border-t border-[#E4E6ED] bg-[#F7FAFF] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4D6FAD]">
                Receipt chain
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Latest linked action receipts
              </p>
            </div>
            <ol className="grid overflow-hidden rounded-xl border border-[#D8DDE8] bg-white sm:grid-cols-3">
              {RECEIPT_SEQUENCES.map((sequence) => (
                <li
                  key={sequence}
                  className="flex items-center gap-2 border-b border-[#E4E6ED] px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                >
                  <Link2
                    className="h-3.5 w-3.5 text-[#4D6FAD]"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs font-semibold text-[#091126]">
                    Sequence {sequence}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
