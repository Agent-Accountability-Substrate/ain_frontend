"use client";

import { Field } from "@base-ui/react/field";
import { Fieldset } from "@base-ui/react/fieldset";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A radio group whose options announce as options.
 *
 * The structure is Base UI's documented form-integration shape and every part
 * of it is load-bearing:
 *
 * - `Fieldset.Root render={<RadioGroup />}` + `Fieldset.Legend` names the
 *   *group*. Putting the group's name on `Field.Label` instead gives every
 *   radio the same `aria-labelledby`, so they all announce identically.
 * - `Field.Item` scopes a label and a description to one control. Without it
 *   the enclosing `Field.Root` owns a single label and every radio inherits it.
 * - The guidance is a `Field.Description`, not part of the label, so the option
 *   is named "Refuse" rather than "Refuse Final. Frees the company number, so
 *   the way forward is a fresh registration — say what was wrong."
 */

export type RadioOption = {
  value: string;
  label: string;
  description?: ReactNode;
};

export function RadioField({
  name,
  legend,
  options,
  value,
  defaultValue,
  onValueChange,
  error,
  className,
}: {
  name: string;
  legend: string;
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  className?: string;
}) {
  return (
    <Field.Root
      name={name}
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-2", className)}
    >
      <Fieldset.Root
        render={
          <RadioGroup
            name={name}
            {...(value === undefined ? { defaultValue } : { value })}
            {...(onValueChange && {
              onValueChange: (next: unknown) => onValueChange(String(next)),
            })}
          />
        }
        className="flex flex-col gap-2"
      >
        <Fieldset.Legend className="sr-only">{legend}</Fieldset.Legend>
        {options.map((option) => (
          <Field.Item
            key={option.value}
            className="rounded-lg border border-line-strong bg-white px-3 py-3 has-data-[checked]:border-ink has-data-[checked]:bg-band"
          >
            <Field.Label className="flex cursor-pointer items-start gap-3 text-xs font-semibold text-ink">
              <Radio.Root
                value={option.value}
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-strong bg-white data-[checked]:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <Radio.Indicator className="h-2 w-2 rounded-full bg-ink data-[unchecked]:hidden" />
              </Radio.Root>
              {option.label}
            </Field.Label>
            {option.description ? (
              <Field.Description className="mt-1 block pl-7 text-[11px] leading-4 text-mist">
                {option.description}
              </Field.Description>
            ) : null}
          </Field.Item>
        ))}
      </Fieldset.Root>
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
