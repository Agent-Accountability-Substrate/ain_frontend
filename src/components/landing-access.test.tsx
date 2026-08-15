import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { action } = vi.hoisted(() => ({ action: vi.fn() }));

vi.mock("@/lib/access-request", () => ({ requestAccessAction: action }));

import { LandingAccessForm } from "@/components/landing-access";

function submit(container: HTMLElement) {
  const form = container.querySelector("form");
  if (!form) throw new Error("form not found");
  fireEvent.submit(form);
}

afterEach(() => {
  action.mockReset();
});

describe("LandingAccessForm", () => {
  it("frames the ask as private preview rather than a signup", () => {
    const { container } = render(<LandingAccessForm />);

    expect(container.textContent).toContain(
      "Subra is in private preview with regulated firms.",
    );
    screen.getByRole("button", { name: "Request access" });
  });

  it("labels the field and submits through a form element", () => {
    const { container } = render(<LandingAccessForm />);

    // A server action on a real <form> posts without hydration, so the ask
    // still works while the bundle is downloading or if it never arrives.
    const field = screen.getByLabelText("Work email");
    expect(field).toHaveProperty("type", "email");
    expect(field.hasAttribute("required")).toBe(true);
    expect(container.querySelector("form")).not.toBeNull();
  });

  it("hides the honeypot from people without hiding it from bots", () => {
    const { container } = render(<LandingAccessForm />);
    const trap = container.querySelector('input[name="company"]');

    // display:none would be skipped by the same crawlers this is meant to
    // catch, so it is moved off-screen instead — and kept out of the
    // accessibility tree and the tab order for everyone else.
    expect(trap).not.toBeNull();
    expect(trap?.getAttribute("aria-hidden")).toBe("true");
    expect(trap?.getAttribute("tabindex")).toBe("-1");
    expect(trap?.className).toContain("left-[-9999px]");
  });

  it("carries the regulator disclaimer", () => {
    const { container } = render(<LandingAccessForm />);

    expect(container.textContent).toContain(
      "not endorsed by or affiliated with any regulator",
    );
  });

  it("asks for one field and nothing more", () => {
    const { container } = render(<LandingAccessForm />);

    // Every extra field is a reason to close the tab, and the page has spent
    // the whole scroll arguing for data minimisation.
    const visible = [...container.querySelectorAll("input")].filter(
      (input) => input.getAttribute("aria-hidden") !== "true",
    );
    expect(visible).toHaveLength(1);
  });

  it("owns no heading, so the footer keeps its own outline", () => {
    const { container } = render(<LandingAccessForm />);

    expect(container.querySelectorAll("h1, h2, h3, h4, h5, h6")).toHaveLength(
      0,
    );
  });

  it("replaces the form with a confirmation naming a human", async () => {
    action.mockResolvedValue({ status: "sent" });
    const { container } = render(<LandingAccessForm />);

    submit(container);

    await waitFor(() => {
      screen.getByText(/Received\./);
    });
    // The form goes, so nobody submits twice wondering whether it took.
    expect(container.querySelector("form")).toBeNull();
    expect(container.textContent).toContain("a named person at Subra");
  });

  it("keeps the form up and announces the reason when it fails", async () => {
    action.mockResolvedValue({
      status: "error",
      message: "Enter a work email address so we can reply.",
    });
    const { container } = render(<LandingAccessForm />);

    submit(container);

    await waitFor(() => {
      screen.getByRole("alert");
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "Enter a work email address",
    );
    expect(container.querySelector("form")).not.toBeNull();

    // The field points at the message, so a screen reader reaching the input
    // hears why the last attempt failed rather than just "Work email".
    const describedBy = screen
      .getByLabelText("Work email")
      .getAttribute("aria-describedby");
    expect(describedBy).toBe(screen.getByRole("alert").id);
  });

  it("keeps the typed address in the field when the send fails", async () => {
    // React resets an uncontrolled form once the action returns, so the
    // address only survives because the action hands it back.
    action.mockImplementation(async (_previous: unknown, data: FormData) => ({
      status: "error",
      message: "That did not send.",
      email: String(data.get("email") ?? ""),
    }));
    const { container } = render(<LandingAccessForm />);
    const field = screen.getByLabelText("Work email") as HTMLInputElement;

    fireEvent.change(field, { target: { value: "head.of.risk@firm.co.uk" } });
    submit(container);

    await waitFor(() => {
      screen.getByRole("alert");
    });
    expect(field.value).toBe("head.of.risk@firm.co.uk");
  });

  it("disables the button while the request is in flight", async () => {
    let release: (value: { status: string }) => void = () => {};
    action.mockReturnValue(
      new Promise<{ status: string }>((resolve) => {
        release = resolve;
      }),
    );
    const { container } = render(<LandingAccessForm />);

    submit(container);

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveProperty("disabled", true);
    });
    expect(screen.getByRole("button").textContent).toContain("Sending");

    release({ status: "sent" });
  });
});
