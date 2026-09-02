import { ArrowRight, Check, Circle } from "lucide-react";

import {
  getPrimaryNextActions,
  type AccountWorkspaceState,
  type PrimaryNextAction,
} from "@/domains/workspace/account-workspace";
import { Card } from "@/lib/ui/card";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { cn } from "@/lib/utils";

/** The step marker: finished, the one to do now, or still ahead. */
const MARK: Record<PrimaryNextAction["state"], string> = {
  completed: "border-success-soft bg-success-wash text-success-strong",
  current: "border-ink bg-ink text-white",
  available: "border-line-strong bg-white text-mist-light",
};

export function PrimaryNextActions({
  state,
}: {
  state: AccountWorkspaceState;
}) {
  const actions = getPrimaryNextActions(state);

  return (
    <Card as="section" aria-labelledby="primary-next-action-title">
      <Eyebrow>Account setup</Eyebrow>
      <h2
        id="primary-next-action-title"
        className="mt-1 text-base font-semibold tracking-[-0.02em] text-ink"
      >
        Primary next action
      </h2>

      <ol className="mt-5">
        {actions.map((action, index) => (
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
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-mist-light">
                Step {index + 1}
              </span>
              <h3 className="text-sm font-semibold text-ink">{action.label}</h3>
              <p className="text-[11px] leading-4 text-mist">{action.detail}</p>
              {action.href ? (
                <a
                  href={action.href}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline"
                >
                  {action.state === "current" ? "Continue" : "Open"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
