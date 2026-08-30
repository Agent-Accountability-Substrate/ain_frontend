"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";

import { Button } from "@/lib/ui/button";

/**
 * A confirmation that has to be answered.
 *
 * An alert dialog rather than a plain one: it takes focus, traps it, and does
 * not dismiss on an outside click, which is the point for an action that
 * cannot be undone.
 *
 * Open state is the caller's, because the thing that opens it is usually a
 * menu item — and a trigger inside a menu unmounts with the menu the instant
 * it is activated.
 *
 * The body is a form so the confirm button submits a Server Action; anything
 * the action needs (hidden fields) and anything it said back (a refusal) goes
 * in `children`, inside that form.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  action,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  action: (formData: FormData) => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[70] bg-ink/25 backdrop-blur-[2px] transition-opacity duration-(--dur-hover) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[71] flex w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-line-strong bg-white p-5 shadow-[0_32px_60px_-30px_rgba(9,17,38,0.5)] transition-[opacity,scale] duration-(--dur-hover) data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 motion-reduce:transition-none">
          <div className="flex flex-col gap-1.5">
            <AlertDialog.Title className="text-sm font-semibold text-ink">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-[11px] leading-4 text-mist">
              {description}
            </AlertDialog.Description>
          </div>

          <form action={action} className="flex flex-col gap-4">
            {children}
            <div className="flex justify-end gap-2">
              <AlertDialog.Close
                render={
                  <Button type="button" variant="secondary">
                    {cancelLabel}
                  </Button>
                }
              />
              <Button
                type="submit"
                disabled={pending}
                className={
                  destructive
                    ? "border-destructive bg-destructive text-white hover:bg-destructive/90 disabled:border-line-strong disabled:bg-line-soft disabled:text-mist"
                    : undefined
                }
              >
                {pending ? "Working…" : confirmLabel}
              </Button>
            </div>
          </form>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
