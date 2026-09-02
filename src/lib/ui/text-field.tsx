"use client";

import { Field } from "@base-ui/react/field";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A labelled text control, wired for server-returned errors.
 *
 * Replaces the sixteen hand-written `<label><span>…</span><input/><small
 * role="alert">` blocks. Those gave the control an accessible name consisting
 * of its label *plus* its helper text *plus*, after a refusal, its error — read
 * out in full on every focus, and the error read twice. `Field` puts the helper
 * on `aria-describedby` and the error on `aria-describedby` + `aria-invalid`,
 * which is what those two attributes are for.
 *
 * `match` is the load-bearing prop and it is deliberately `true` rather than a
 * `ValidityState` key. `Field.Error`'s default keys off native constraint
 * validation, so a message the *server* produced renders nothing; `match={true}`
 * is the documented hand-off for exactly that. The consequence, recorded so it
 * is a decision rather than a discovery: per-constraint messages (and with them
 * the library's message-localisation hook) are foreclosed while every error in
 * this product comes back from a Server Action.
 *
 * `match={true}` means *always render*, so the element is only mounted when
 * there is something to say. Left unconditional it put an empty `<div>` under
 * every field in the product and, worse, registered that empty element as the
 * control's `aria-describedby` target — a description resolving to nothing on
 * every input, select, radio group and checkbox.
 *
 * Uncontrolled by design. `Field.Control` forwards `name` and does not force a
 * controlled value, so `formData.get(name)` in the action is unchanged.
 */

export const CONTROL_CLASS =
  "w-full rounded-lg border border-line-strong bg-white px-3 py-2.5 text-xs text-ink transition-colors duration-(--dur-hover) placeholder:text-mist-light focus:outline-2 focus:-outline-offset-1 focus:outline-ink data-[invalid]:border-destructive";

export function TextField({
  label,
  description,
  error,
  multiline = false,
  className,
  ...control
}: Omit<ComponentPropsWithoutRef<"input">, "children"> & {
  label: ReactNode;
  /** Helper text. Announced through `aria-describedby`, not the label. */
  description?: ReactNode;
  /** A message from the server. Presence alone marks the field invalid. */
  error?: string;
  /** Renders a `<textarea>` rather than an `<input>`. */
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <Field.Root
      name={control.name}
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <Field.Label className="text-[11px] font-semibold text-ink-soft">
        {label}
      </Field.Label>
      <Field.Control
        // The one place a `textarea` is asked for by name. Before this, the
        // string "textarea" appeared nowhere in the stylesheet, so all four of
        // them rendered as unstyled browser defaults — no border, no focus
        // ring — inside otherwise fully restyled forms.
        render={multiline ? <textarea /> : undefined}
        className={cn(CONTROL_CLASS, multiline && "min-h-20 resize-y")}
        {...control}
      />
      {description ? (
        <Field.Description className="text-[11px] leading-4 text-mist">
          {description}
        </Field.Description>
      ) : null}
      {error ? (
        <Field.Error
          match={true}
          className="text-[11px] font-medium text-destructive"
        >
          {error}
        </Field.Error>
      ) : null}
    </Field.Root>
  );
}
