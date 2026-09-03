"use client";

import { useActionState, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import {
  transitionAgentAction,
  type TransitionAgentState,
} from "@/domains/agents/agent-actions";
import type { AgentTransition } from "@/domains/agents/agent-record";
import { ConfirmDialog } from "@/lib/ui/alert-dialog";
import { Menu, MenuItem } from "@/lib/ui/menu";
import { TextField } from "@/lib/ui/text-field";

/**
 * Withdrawing an agent's authority.
 *
 * Two transitions rather than one "change status" control, matching the
 * registry: they admit different current statuses and one of them is terminal.
 * Which are offered comes from the agent's own status, so the menu never shows
 * an act the registry would refuse.
 *
 * Both ask, and both require a reason — the registry does, and an owner told
 * their agent was suspended with no explanation has nothing to act on. The
 * reason lands in the audit log, never in the signed lifecycle event, whose key
 * set is fixed by the contract.
 */

const COPY: Record<
  AgentTransition,
  {
    label: string;
    title: (name: string) => string;
    description: string;
    confirm: string;
    prompt: string;
  }
> = {
  suspend: {
    label: "Suspend this agent",
    title: (name) => `Suspend ${name}?`,
    description:
      "Its authority is withdrawn and the resolver stops serving it. There is no reinstatement in this release — the lifecycle ledger has no such event — so this is reversible only by re-registering under a new identifier.",
    confirm: "Suspend",
    prompt: "Why this is being suspended",
  },
  revoke: {
    label: "Revoke this agent",
    title: (name) => `Revoke ${name}?`,
    description:
      "This is terminal. Nothing follows a revocation, the resolver stops serving the agent on the next request, and the identifier is never reissued or recycled.",
    confirm: "Revoke",
    prompt: "Why this is being revoked",
  },
};

/**
 * One attempt at one transition.
 *
 * Its own component so that the parent can remount it per attempt: a
 * `useActionState` result has no reset, so a component that survived a
 * successful transition would carry `done` into the next one and refuse to
 * open its dialog — which is exactly what suspending and then revoking does.
 */
function TransitionDialog({
  agentName,
  ain,
  organisationId,
  transition,
  onClose,
}: {
  agentName: string;
  ain: string;
  organisationId: string;
  transition: AgentTransition;
  onClose: () => void;
}) {
  const [result, formAction, pending] = useActionState<
    TransitionAgentState,
    FormData
  >(transitionAgentAction, { status: "idle" });
  const copy = COPY[transition];

  // Derived rather than closed by an effect: a recorded transition revalidates
  // the record beneath, so the dialog should not still be sitting over a state
  // that has already changed. A refusal keeps it open, because the registry's
  // reason is inside it.
  const open = result.status !== "done";

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={copy.title(agentName)}
      description={copy.description}
      confirmLabel={copy.confirm}
      destructive
      pending={pending}
      action={formAction}
    >
      <input
        type="hidden"
        name="organisationId"
        value={organisationId}
        readOnly
      />
      <input type="hidden" name="ain" value={ain} readOnly />
      <input type="hidden" name="transition" value={transition} readOnly />
      <TextField
        label={copy.prompt}
        name="reason"
        multiline
        rows={3}
        required
        placeholder="The model behind this agent was replaced without a scope review."
        description="Recorded in the audit log for this organisation."
        error={result.status === "error" ? result.errors["reason"] : undefined}
      />
      {result.status === "error" && result.errors["reason"] === undefined ? (
        <p role="alert" className="text-[11px] leading-4 text-destructive">
          {result.message}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}

export function AgentLifecycleMenu({
  agentName,
  ain,
  organisationId,
  transitions,
}: {
  agentName: string;
  ain: string;
  organisationId: string;
  transitions: readonly AgentTransition[];
}) {
  // The attempt number is the dialog's key, so every choice starts from a
  // fresh action state — including choosing the same transition twice after a
  // refusal.
  const [attempt, setAttempt] = useState<{
    n: number;
    transition: AgentTransition;
  } | null>(null);

  return (
    <>
      <Menu
        triggerLabel={`Manage ${agentName}`}
        triggerClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-white text-mist hover:border-ink/20 hover:text-ink data-[popup-open]:border-ink/30"
        trigger={<MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
      >
        {transitions.map((transition) => (
          <MenuItem
            key={transition}
            nativeButton
            render={<button type="button" />}
            onClick={() =>
              setAttempt((current) => ({
                n: (current?.n ?? 0) + 1,
                transition,
              }))
            }
            className="text-destructive data-[highlighted]:bg-destructive/8 data-[highlighted]:text-destructive"
          >
            {COPY[transition].label}
          </MenuItem>
        ))}
      </Menu>

      {attempt ? (
        <TransitionDialog
          key={attempt.n}
          agentName={agentName}
          ain={ain}
          organisationId={organisationId}
          transition={attempt.transition}
          onClose={() => setAttempt(null)}
        />
      ) : null}
    </>
  );
}
