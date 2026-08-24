import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccessForm } from "@/domains/marketing/access-form";

const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: "idle" } as Record<string, unknown> },
}));

// `useActionState` needs a real dispatcher and a real action; the states worth
// asserting here are what each one renders, so the hook is replaced with the
// state the test is about.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: () => [actionState.current, vi.fn(), false],
  };
});

vi.mock("@/domains/marketing/access-request", () => ({
  requestAccessAction: vi.fn(),
}));

describe("AccessForm", () => {
  it("asks for a name and a work email", () => {
    actionState.current = { status: "idle" };
    render(<AccessForm />);

    expect(screen.getByLabelText("Full name")).toBeDefined();
    expect(screen.getByLabelText("Work email")).toBeDefined();
    expect(screen.getByRole("button", { name: "Book a demo" })).toBeDefined();
  });

  it("carries a honeypot the visitor never sees", () => {
    actionState.current = { status: "idle" };
    const { container } = render(<AccessForm />);

    const honeypot = container.querySelector('input[name="company"]');
    // Off-screen rather than display:none — a bot that reads computed styles
    // skips the latter, and this is the cheapest signal available.
    expect(honeypot).not.toBeNull();
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(honeypot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("names a mailbox on the resting state, so there is always a way through", () => {
    actionState.current = { status: "idle" };
    render(<AccessForm />);

    expect(
      screen.getByRole("link", { name: "partner@subrahq.com" }),
    ).toBeDefined();
  });

  it("confirms a send without leaving the form looking unsubmitted", () => {
    actionState.current = { status: "sent" };
    render(<AccessForm />);

    expect(screen.getByText(/that reached us/i)).toBeDefined();
  });

  it("shows the failure message and puts back what was typed", () => {
    actionState.current = {
      status: "error",
      message: "That did not send.",
      name: "Ada Lovelace",
      email: "ada@firm.co.uk",
    };
    render(<AccessForm />);

    expect(screen.getByText("That did not send.")).toBeDefined();
    // React resets an uncontrolled input once the action returns, so without
    // these the visitor retypes both fields after a failure that was ours.
    expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe(
      "Ada Lovelace",
    );
    expect(
      (screen.getByLabelText("Work email") as HTMLInputElement).value,
    ).toBe("ada@firm.co.uk");
  });

  it("announces the outcome politely rather than stealing focus", () => {
    actionState.current = { status: "sent" };
    const { container } = render(<AccessForm />);

    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
