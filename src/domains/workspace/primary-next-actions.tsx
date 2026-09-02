import Link from "next/link";
import {
  ArrowRight,
  Check,
  Circle,
  Hourglass,
  LockKeyhole,
} from "lucide-react";

import {
  getPrimaryNextActions,
  isSetupComplete,
  type AccountWorkspaceState,
  type PrimaryNextAction,
} from "@/domains/workspace/account-workspace";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { cn } from "@/lib/utils";

/** The step marker: done, yours now, waiting on us, or still ahead. */
const MARK: Record<PrimaryNextAction["state"], string> = {
  completed: "border-success-soft bg-success-wash text-success-strong",
  current: "border-ink bg-ink text-white",
  waiting: "border-warm-600/40 bg-warm-wash text-warm-700",
  available: "border-line-strong bg-white text-mist-light",
};

/**
 * Getting an account from nothing to its first signed record.
 *
 * Renders while there is something left to do, then stops existing: nothing
 * here is navigation, so a fully ticked card would be a report on finished
 * work in the best column of the screen.
 *
 * Steps are split by who holds them — yours, and ours — because a review
 * nobody in this account can act on reads as a task you are failing when it
 * sits among the rest as an unticked box.
 */
export function PrimaryNextActions({
  state,
}: {
  state: AccountWorkspaceState;
}) {
  if (isSetupComplete(state)) return null;

  const actions = getPrimaryNextActions(state);
  const done = actions.filter((action) => action.state === "completed").length;
  // Only the steps that are yours are numbered, so a review sitting between
  // two of them does not make the next one "step 4 of 3".
  const numbered = actions.filter((action) => action.state !== "waiting");
  const number = (action: PrimaryNextAction) => numbered.indexOf(action) + 1;
  const yours = actions.filter(
    (action) => action.state === "current" || action.state === "available",
  ).length;

  return (
    <Card as="section" aria-labelledby="primary-next-action-title">
      <Eyebrow>Getting started</Eyebrow>
      <h2
        id="primary-next-action-title"
        className="mt-1 text-base font-semibold tracking-[-0.02em] text-ink"
      >
        {yours === 0
          ? "Nothing to do right now"
          : `${yours} step${yours === 1 ? "" : "s"} left`}
      </h2>

      {/* A bar part-filled reads as momentum where a list of unticked boxes
          reads as a backlog. */}
      <div
        className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line-soft"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={actions.length}
        aria-valuenow={done}
        aria-label={`${done} of ${actions.length} steps done`}
      >
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-(--dur-state)"
          style={{ width: `${(done / actions.length) * 100}%` }}
        />
      </div>

      <ol className="mt-5">
        {actions.map((action) => (
          <li
            key={action.label}
            data-state={action.state}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 pb-5 last:pb-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-6.5 w-6.5 items-center justify-center rounded-full border",
                MARK[action.state],
              )}
            >
              {action.state === "completed" ? (
                <Check className="h-3.5 w-3.5" />
              ) : action.state === "waiting" ? (
                <Hourglass className="h-3.5 w-3.5" />
              ) : action.blockedBy ? (
                <LockKeyhole className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-mist-light">
                {action.state === "waiting"
                  ? "With us"
                  : `Step ${number(action)}`}
              </span>
              <h3 className="text-sm font-semibold text-ink">{action.label}</h3>
              <p className="text-[11px] leading-4 text-mist">{action.detail}</p>
              {/* Named, so a locked step is a consequence rather than a
                  refusal. */}
              {action.blockedBy ? (
                <p className="text-[11px] leading-4 text-mist-light">
                  Opens after {action.blockedBy}.
                </p>
              ) : null}
              {/* A finished step has nothing to open. */}
              {action.href && action.state !== "completed" ? (
                <Link
                  href={action.href}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline"
                >
                  {action.state === "current"
                    ? "Continue"
                    : action.state === "waiting"
                      ? "See what is needed"
                      : "Open"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
