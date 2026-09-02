"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Field } from "@base-ui/react/field";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A single checkbox with its statement beside it.
 *
 * `Checkbox.Root` renders the visible control plus a visually-hidden native
 * input that carries `name` into the form — so `formData.get(name)` works, and
 * so a test must query by role rather than by label (the label matches both
 * elements).
 */
export function CheckboxField({
  name,
  children,
  checked,
  defaultChecked,
  onCheckedChange,
  required,
  error,
  className,
}: {
  name?: string;
  children: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <Field.Root
      name={name}
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <Field.Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-strong bg-white px-3 py-3 text-xs leading-5 text-ink-soft">
        <Checkbox.Root
          name={name}
          required={required}
          {...(checked === undefined ? { defaultChecked } : { checked })}
          {...(onCheckedChange && { onCheckedChange })}
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-line-strong bg-white data-[checked]:border-ink data-[checked]:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <Checkbox.Indicator>
            <Check className="h-3 w-3 text-white" aria-hidden="true" />
          </Checkbox.Indicator>
        </Checkbox.Root>
        <span>{children}</span>
      </Field.Label>
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
