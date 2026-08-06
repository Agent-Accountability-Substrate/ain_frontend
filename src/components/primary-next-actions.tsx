import { ArrowRight, Check, Circle } from "lucide-react";

import {
  getPrimaryNextActions,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

export function PrimaryNextActions({
  state,
}: {
  state: AccountWorkspaceState;
}) {
  const actions = getPrimaryNextActions(state);

  return (
    <section
      className="primary-next-actions"
      aria-labelledby="primary-next-action-title"
    >
      <p className="dashboard-eyebrow">Account setup</p>
      <h2 id="primary-next-action-title">Primary next action</h2>
      <ol>
        {actions.map((action, index) => (
          <li key={action.label} data-state={action.state}>
            <span className="primary-next-action-mark" aria-hidden="true">
              {action.state === "completed" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
            </span>
            <div>
              <span className="primary-next-action-index">
                Step {index + 1}
              </span>
              <h3>{action.label}</h3>
              <p>{action.detail}</p>
              {action.href ? (
                <a href={action.href}>
                  {action.state === "current" ? "Continue" : "Open"}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
