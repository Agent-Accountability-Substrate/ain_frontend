"use client";

import { Field } from "@base-ui/react/field";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { CONTROL_CLASS } from "@/lib/ui/text-field";

/**
 * A labelled select.
 *
 * `items` is required, not optional, and that is the whole reason this wrapper
 * exists rather than the parts being assembled per call site. Without it
 * `Select.Root` renders the raw *value* in the trigger — and every select in
 * this product has a value that is not its label (an organisation UUID, `gb`
 * for "United Kingdom", `low` for "Low"). Requiring it makes the failure
 * impossible to reach instead of merely unlikely.
 *
 * `name` reaches `Select.Root`, which is what renders the hidden input the form
 * submits. Passing it to the trigger instead type-checks, renders correctly,
 * and silently posts nothing.
 *
 * `modal={false}` because Base UI defaults it to `true`, which — by its own
 * documented contract — locks document scroll and disables pointer interaction
 * outside the popup while it is open. The workspace shell already owns the
 * page's scrolling behaviour, and a select is not a dialog: taking the document
 * hostage to choose an organisation is not today's behaviour and not a change
 * this component should make on its own.
 */

export type SelectItem = { label: string; value: string };

export function SelectField({
  label,
  name,
  items,
  description,
  error,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
  placeholder = "Select an option",
  labelHidden = false,
}: {
  label: ReactNode;
  name?: string;
  items: readonly SelectItem[];
  description?: ReactNode;
  error?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** Keeps the label in the accessibility tree while hiding it visually. */
  labelHidden?: boolean;
}) {
  return (
    <Field.Root
      name={name}
      invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {/* Not a native `<label>`: the control it names is `Select.Trigger`, a
          `<button>`, and a button is labelable — so `htmlFor` made hovering
          the caption apply the trigger's `:hover`, and clicking the caption
          open the popup. Base UI documents this prop for exactly this pair. */}
      <Field.Label
        nativeLabel={false}
        render={<div />}
        className={cn(
          "text-[11px] font-semibold text-ink-soft",
          labelHidden && "sr-only",
        )}
      >
        {label}
      </Field.Label>
      <Select.Root
        name={name}
        items={items as SelectItem[]}
        modal={false}
        disabled={disabled}
        {...(value === undefined ? { defaultValue } : { value })}
        // Base UI reports a cleared selection as `null`. The workspace's
        // "no organisation selected" has always been the empty string — it is
        // what deletes the `?org=` param — so the two are reconciled here
        // rather than at every call site.
        {...(onValueChange && {
          onValueChange: (next: string | null) => onValueChange(next ?? ""),
        })}
      >
        <Select.Trigger
          className={cn(
            CONTROL_CLASS,
            "flex items-center justify-between gap-3 text-left",
          )}
        >
          <Select.Value placeholder={placeholder} />
          <Select.Icon>
            <ChevronDown className="h-3.5 w-3.5 text-mist" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          {/* z-index sits on the Positioner, not the Portal: the portal element
              is statically positioned, so z-index does not apply to it. */}
          <Select.Positioner sideOffset={6} className="z-[60]">
            <Select.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-xl border border-line-strong bg-white p-1 shadow-[0_24px_50px_-24px_rgba(9,17,38,0.45)]">
              <Select.List>
                {items.map((item) => (
                  <Select.Item
                    key={item.value}
                    value={item.value}
                    className="flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs text-ink-soft data-[highlighted]:bg-wash-blue data-[highlighted]:text-ink data-[selected]:font-semibold"
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check
                        className="h-3.5 w-3.5 text-cobalt"
                        aria-hidden="true"
                      />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
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
