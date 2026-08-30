"use client";

import { Accordion } from "@base-ui/react/accordion";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck2,
  KeyRound,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  WorkspaceContent,
  WorkspacePane,
} from "@/domains/workspace/workspace-content";
import {
  assuranceProfileLabel,
  isEmailOnlyAssurance,
  type IndividualAssuranceStatus,
  type IndividualAssuranceSummary,
} from "@/domains/identity/identity-assurance";
import { WORKSPACE } from "@/domains/workspace/workspace-routes";
import type { StatusTone } from "@/lib/ui/status-pill";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { StatusPill } from "@/lib/ui/status-pill";
import { cn } from "@/lib/utils";

/**
 * The identity check: the one thing to do, then the questions about it.
 *
 * The check itself is a plain card that cannot be collapsed, because the button
 * is why the screen exists and reading about data handling should never take it
 * off screen. Everything that answers "and what about…" is a row you open only
 * if you are asking. Those panels stay in the document — `hiddenUntilFound` —
 * so find-in-page still reaches them and a closed row is never a hidden answer.
 */

const CHECK_STEPS = [
  {
    icon: FileCheck2,
    title: "Government-issued photo ID",
    copy: "A UK identity provider checks that the document is authentic and belongs to you.",
  },
  {
    icon: ScanFace,
    title: "Likeness and liveness",
    copy: "The provider compares you with the document and tests that a real person is present.",
  },
  {
    icon: ShieldCheck,
    title: "The outcome, and nothing else",
    copy: "We keep the result and an audit reference — not document images, selfies or video.",
  },
] as const;

const UNLOCKED = [
  "Register a UK company",
  "Submit it for verification",
] as const;

const LOCKED = [
  "Register and manage agents",
  "Mint permanent AINs and issue signing keys",
  "Publish resolver records, receipts and evidence packs",
] as const;

const CARD =
  "rounded-2xl border border-line bg-white/95 shadow-[0_16px_36px_-34px_rgba(9,17,38,0.6)]";

const STATUS: Record<
  IndividualAssuranceStatus,
  { label: string; tone: StatusTone }
> = {
  not_started: { label: "Not started", tone: "pending" },
  pending: { label: "In progress", tone: "pending" },
  needs_review: { label: "Being reviewed", tone: "attention" },
  verified: { label: "Verified", tone: "success" },
  failed: { label: "Could not be completed", tone: "refused" },
  expired: { label: "Expired", tone: "attention" },
};

/**
 * Icon chip, title, and the one line of detail worth reading unopened.
 *
 * `heading` because the two callers differ in what the title may legally be: a
 * collapsed row already takes its heading level from `Accordion.Header`, and
 * its trigger is a button, which may not contain one. The fixed card has no
 * such wrapper, so it carries the real `h2`.
 */
function RowHeading({
  icon: Icon,
  title,
  meta,
  heading = false,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  heading?: boolean;
}) {
  const Title = heading ? "h2" : "span";
  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-wash-blue text-cobalt">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <Title className="min-w-0 flex-1 text-sm font-semibold text-ink">
        {title}
      </Title>
      <span className="shrink-0 text-[11px] text-mist max-sm:hidden">
        {meta}
      </span>
    </>
  );
}

/** One of the questions: closed until somebody is asking it. */
function Question({
  value,
  icon,
  title,
  meta,
  children,
}: {
  value: string;
  icon: LucideIcon;
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item value={value} className={CARD}>
      <Accordion.Header className="m-0">
        <Accordion.Trigger className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
          <RowHeading icon={icon} title={title} meta={meta} />
          <ChevronDown
            className="h-4 w-4 shrink-0 text-mist transition-transform duration-(--dur-hover) group-data-[panel-open]:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-(--dur-hover) data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
        <div className="px-5 pb-5">{children}</div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

function Bullets({
  items,
  icon: Icon,
  tone,
}: {
  items: readonly string[];
  icon: LucideIcon;
  tone: "unlocked" | "locked";
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-2 text-[11px] leading-4",
            tone === "unlocked" ? "text-ink-soft" : "text-mist",
          )}
        >
          <Icon
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0",
              tone === "unlocked" && "text-success-strong",
            )}
            aria-hidden="true"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function IdentityOnboardingView({
  assurance,
}: {
  assurance: IndividualAssuranceSummary;
}) {
  const status = STATUS[assurance.status];
  const level = assuranceProfileLabel(assurance.assuranceProfile);
  const emailOnly = isEmailOnlyAssurance(assurance);

  return (
    <WorkspaceContent columns="single">
      <WorkspacePane className="mx-auto flex w-[min(100%,46rem)] flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <Eyebrow>Identity check</Eyebrow>
              {/* Status and level together: "Verified" alone would claim this
                  check has happened when a confirmed email address is all the
                  registry holds. */}
              <StatusPill tone={status.tone}>
                {level === null ? status.label : `${status.label} · ${level}`}
              </StatusPill>
            </div>
            <h1 className="text-[clamp(1.65rem,2.5vw,2.2rem)] font-bold leading-[1.1] tracking-[-0.045em] text-ink">
              Verify the person behind the organisation
            </h1>
            <p className="max-w-[46ch] text-xs leading-[1.65] text-mist">
              {emailOnly
                ? "So far we have only confirmed your email address. This check confirms who you are."
                : "A one-off check, so we know who is registering the company."}
            </p>
          </div>
          {/* Nothing here blocks registering a company, and the check can be
              picked up again from the account settings. */}
          <Link
            href={WORKSPACE}
            aria-label="Close the identity check"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mist transition-colors duration-(--dur-hover) hover:bg-band hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <section className={cn(CARD, "flex flex-col gap-4 p-5")}>
          <div className="flex items-center gap-3">
            <RowHeading
              icon={ScanFace}
              title="What the check will involve"
              meta="3 steps"
              heading
            />
          </div>

          <ol className="flex flex-col gap-3">
            {CHECK_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-line bg-panel px-3.5 py-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-wash-blue text-cobalt">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold text-ink">
                      {index + 1}. {step.title}
                    </p>
                    <p className="text-[11px] leading-4 text-mist">
                      {step.copy}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled
              aria-describedby="identity-provider-status"
              className="inline-flex w-fit cursor-not-allowed items-center gap-2 rounded-lg border border-line-strong bg-line-soft px-4 py-2.5 text-xs font-semibold text-mist"
            >
              Begin identity check
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <p
              id="identity-provider-status"
              role="status"
              className="text-[11px] text-mist"
            >
              This check is not open yet. Nothing is needed from you until it
              is.
            </p>
          </div>
        </section>

        <Accordion.Root hiddenUntilFound className="flex flex-col gap-3">
          <Question
            value="unlocks"
            icon={KeyRound}
            title="What passing it unlocks"
            meta="Company registration"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Eyebrow>Opens</Eyebrow>
                <Bullets items={UNLOCKED} icon={Check} tone="unlocked" />
              </div>
              <div className="flex flex-col gap-2">
                <Eyebrow>Still needs the company verified</Eyebrow>
                <Bullets items={LOCKED} icon={LockKeyhole} tone="locked" />
              </div>
            </div>
          </Question>

          <Question
            value="data"
            icon={ShieldCheck}
            title="What we keep, and what happens if it fails"
            meta="Outcome and reference only"
          >
            <div className="flex flex-col gap-3 text-[11px] leading-4 text-mist">
              <p>
                The provider handles identity evidence in its own hosted
                service. We keep the outcome, the timestamps and an opaque audit
                reference — no document images, selfies, video or biometric
                templates.
              </p>
              <p>
                A provider that cannot place you leads to a retry or a manual
                review, not a permanent denial.
              </p>
            </div>
          </Question>
        </Accordion.Root>
      </WorkspacePane>
    </WorkspaceContent>
  );
}
