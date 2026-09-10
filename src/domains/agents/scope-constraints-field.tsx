"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/lib/ui/button";
import { Callout } from "@/lib/ui/callout";
import { Eyebrow } from "@/lib/ui/eyebrow";
import { SelectField } from "@/lib/ui/select-field";
import { TextField } from "@/lib/ui/text-field";

/**
 * Bounds on what an authorised action may do.
 *
 * An action class says an agent may initiate payments; a constraint says up to
 * how much. Without one, every scope this product can declare is unbounded
 * within its classes — which is a weaker claim than the signed document is
 * capable of carrying, and a weaker one than the resolver will be asked to
 * evaluate.
 *
 * Each row is a real form field rather than a serialised blob, so the rows
 * post as parallel `constraintClass` / `constraintKey` / `constraintType` /
 * `constraintValue` lists and the action reads them with `getAll`.
 *
 * The **type** is asked for, not guessed. The scope evaluator refuses a bound
 * of the wrong type, and it treats booleans and numbers as different kinds on
 * purpose, so a form that posted everything as text would declare bounds that
 * only fail later, at admission.
 *
 * What a key *means* is not asked for, and cannot be: contract v1 carries the
 * key and its value but not the comparison. Whether `max_value_gbp` is a
 * ceiling is the vocabulary's to say, not this form's.
 */

export type ConstraintRow = {
  id: string;
  actionClass: string;
  key: string;
  type: string;
  value: string;
};

const TYPES = [
  { value: "number", label: "Number" },
  { value: "string", label: "Text" },
  { value: "boolean", label: "True or false" },
  { value: "string_list", label: "List of values" },
] as const;

export function newConstraintRow(actionClass = ""): ConstraintRow {
  return {
    // `crypto.randomUUID` rather than an index: React keys off this, and rows
    // are removed from the middle.
    id: crypto.randomUUID(),
    actionClass,
    key: "",
    type: "number",
    value: "",
  };
}

export function ScopeConstraintsField({
  actionClasses,
  rows,
  onChange,
  error,
}: {
  /** The classes declared above. A bound must name one of them. */
  actionClasses: readonly string[];
  rows: readonly ConstraintRow[];
  onChange: (rows: readonly ConstraintRow[]) => void;
  error?: string;
}) {
  const update = (id: string, patch: Partial<ConstraintRow>) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  return (
    <fieldset className="flex flex-col gap-3 sm:col-span-2">
      <div className="flex flex-col gap-1">
        <Eyebrow>
          <legend>Constraints (optional)</legend>
        </Eyebrow>
        <p className="text-[11px] leading-4 text-mist">
          Bounds on a listed action — a ceiling, a permitted set. Without one,
          the action is authorised without limit.
        </p>
      </div>

      {actionClasses.length === 0 ? (
        <Callout>
          List an authorised action above first. A bound has to name one of
          them.
        </Callout>
      ) : (
        <>
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-line bg-panel p-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <SelectField
                label="Applies to"
                name="constraintClass"
                items={actionClasses.map((value) => ({ value, label: value }))}
                value={row.actionClass}
                onValueChange={(actionClass) => update(row.id, { actionClass })}
              />
              <TextField
                label="Bound"
                name="constraintKey"
                value={row.key}
                onChange={(event) =>
                  update(row.id, { key: event.target.value })
                }
                placeholder="max_value_gbp"
              />
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove the bound on ${row.actionClass || "this action"}`}
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
                className="self-end text-mist hover:text-destructive"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
              <SelectField
                label="Value type"
                name="constraintType"
                items={TYPES}
                value={row.type}
                onValueChange={(type) => update(row.id, { type })}
              />
              <TextField
                className="sm:col-span-2"
                label="Value"
                name="constraintValue"
                value={row.value}
                onChange={(event) =>
                  update(row.id, { value: event.target.value })
                }
                placeholder={row.type === "string_list" ? "GBP, EUR" : "5000"}
              />
            </div>
          ))}

          {error ? (
            <Callout tone="danger" alert>
              {error}
            </Callout>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            className="w-fit"
            onClick={() =>
              onChange([...rows, newConstraintRow(actionClasses[0] ?? "")])
            }
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add a bound
          </Button>
        </>
      )}
    </fieldset>
  );
}
