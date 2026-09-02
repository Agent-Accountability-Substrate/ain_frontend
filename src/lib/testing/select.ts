import { fireEvent, screen, waitFor, within } from "@testing-library/react";

/**
 * Driving a `SelectField` from a test.
 *
 * A native `<select>` took a single `fireEvent.change`. A listbox does not: it
 * opens on click into a portal, and its items commit on pointer-up rather than
 * on click, so a bare `fireEvent.click` on an option opens the popup, finds the
 * row, and changes nothing — a test that looks like it exercised the control and
 * asserts on a value that was never set.
 *
 * These live here rather than in each test file so that "how you operate a
 * select" is written down once, and so the next select's test cannot
 * accidentally invent a sequence that silently no-ops.
 */

/** The trigger, addressed by the accessible name its label gives it. */
export function selectTrigger(name: string): HTMLElement {
  return screen.getByRole("combobox", { name });
}

export async function openSelect(name: string): Promise<HTMLElement> {
  fireEvent.click(selectTrigger(name));
  const listbox = await screen.findByRole("listbox");

  // The popup mounts a frame before focus reaches it. Returning on the mount
  // alone hands back a listbox that is not yet listening, and a key sent to
  // `document.activeElement` goes to the body and is dropped without a word.
  // Whether the frame has landed by then depends on what ran before, so a
  // keyboard assertion written that way passes on its own and fails after a
  // sibling test that left an exit animation pending — a false green that
  // moves with test order.
  await waitFor(() => {
    if (!listbox.contains(document.activeElement)) {
      throw new Error("the listbox has not taken focus yet");
    }
  });

  return listbox;
}

/** Open the named select and commit one of its options. */
export async function chooseOption(
  selectName: string,
  optionName: string | RegExp,
): Promise<void> {
  const listbox = await openSelect(selectName);
  const option = within(listbox).getByRole("option", { name: optionName });
  // Base UI commits on pointer-up. The full sequence, because a partial one is
  // silently inert.
  fireEvent.pointerDown(option, { pointerType: "mouse", button: 0 });
  fireEvent.mouseDown(option, { button: 0 });
  fireEvent.pointerUp(option, { pointerType: "mouse", button: 0 });
  fireEvent.mouseUp(option, { button: 0 });
  fireEvent.click(option, { button: 0 });
}
