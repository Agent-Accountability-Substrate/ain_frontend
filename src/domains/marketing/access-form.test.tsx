import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccessForm } from "@/domains/marketing/access-form";

const { actionState } = vi.hoisted(() => ({
  actionState: { current: { status: "idle" } as Record<string, unknown> },
}));

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
  it("presents the complete private-preview request", () => {
    actionState.current = { status: "idle" };
    const { container } = render(<AccessForm />);

    expect(screen.getAllByText("Private preview")).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Be ready to explain every agent action that matters.",
    );
    for (const label of ["Name", "Work email", "Organisation", "Role"]) {
      expect(
        screen.getByRole("textbox", { name: label }).hasAttribute("required"),
      ).toBe(true);
    }
    expect(
      screen
        .getByRole("textbox", {
          name: "Which agent workflow are you responsible for?",
        })
        .hasAttribute("required"),
    ).toBe(false);
    expect(
      screen.getByRole("button", { name: "Request private preview" }),
    ).toBeDefined();
    expect(container.textContent).not.toContain("—");
    expect(container.textContent).not.toContain(
      "For example, payments, underwriting, or claims.",
    );
    const section = container.querySelector("#request");
    expect(section?.className).toContain("linear-gradient");
    expect(section?.classList.contains("private-preview-stage")).toBe(true);
    expect(section?.classList.contains("border-t")).toBe(false);
    const watermark = section?.querySelector(".private-preview-watermark");
    expect(watermark?.textContent?.replace(/\s+/g, " ").trim()).toBe(
      "Private preview",
    );
    expect(watermark?.getAttribute("aria-hidden")).toBe("true");
    expect(section?.querySelectorAll('[aria-hidden="true"]')).not.toHaveLength(
      0,
    );
  });

  it("adds subtle pointer depth without moving the form card", () => {
    actionState.current = { status: "idle" };
    const { container } = render(<AccessForm />);
    const section = container.querySelector("#request") as HTMLElement;
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 1000,
      bottom: 500,
      left: 0,
      width: 1000,
      height: 500,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(section, {
      clientX: 750,
      clientY: 125,
      pointerType: "mouse",
    });
    expect(section.style.getPropertyValue("--preview-x")).toBe("0.500");
    expect(section.style.getPropertyValue("--preview-y")).toBe("-0.500");

    fireEvent.pointerLeave(section, { pointerType: "mouse" });
    expect(section.style.getPropertyValue("--preview-x")).toBe("0");
    expect(section.style.getPropertyValue("--preview-y")).toBe("0");
    expect(section.querySelector("form")?.className).not.toContain(
      "private-preview",
    );
  });

  it("carries an off-screen honeypot that is not the organisation field", () => {
    actionState.current = { status: "idle" };
    const { container } = render(<AccessForm />);

    expect(
      screen
        .getByRole("textbox", { name: "Organisation" })
        .getAttribute("name"),
    ).toBe("organisation");
    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot?.getAttribute("tabindex")).toBe("-1");
    expect(honeypot?.getAttribute("aria-hidden")).toBe("true");
  });

  it("links the consent statement to a real privacy route", () => {
    actionState.current = { status: "idle" };
    render(<AccessForm />);

    expect(
      screen.getByRole("link", { name: "Privacy Notice" }).getAttribute("href"),
    ).toBe("/privacy");
  });

  it("shows exact client-side validation messages", () => {
    actionState.current = { status: "idle" };
    render(<AccessForm />);

    fireEvent.submit(
      screen.getByRole("form", { name: "Private preview request" }),
    );

    expect(screen.getAllByText("This field is required.")).toHaveLength(4);
    expect(
      screen
        .getByRole("textbox", { name: "Name" })
        .getAttribute("aria-invalid"),
    ).toBe("true");

    fireEvent.change(screen.getByRole("textbox", { name: "Work email" }), {
      target: { value: "not-an-address" },
    });
    fireEvent.submit(
      screen.getByRole("form", { name: "Private preview request" }),
    );
    expect(screen.getByText("Enter a valid work email address.")).toBeDefined();
  });

  it("renders the success state without a response-time promise", () => {
    actionState.current = { status: "sent" };
    const { container } = render(<AccessForm />);

    expect(
      screen.getByText("Thank you. Your request has been received."),
    ).toBeDefined();
    expect(
      screen.getByText("A member of the team will be in touch."),
    ).toBeDefined();
    expect(container.textContent).not.toMatch(/hours|reply within/i);
  });

  it("shows a recoverable failure and restores every submitted value", () => {
    actionState.current = {
      status: "error",
      message:
        "We couldn't submit your request. Please try again, or email partner@subrahq.com directly.",
      values: {
        name: "Ada Lovelace",
        email: "ada@firm.co.uk",
        organisation: "Example Financial Services",
        role: "Head of Risk",
        workflow: "Payments operations",
      },
    };
    render(<AccessForm />);

    expect(screen.getByText(/couldn't submit your request/i)).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "partner@subrahq.com" })
        .getAttribute("href"),
    ).toBe("mailto:partner@subrahq.com");
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value,
    ).toBe("Ada Lovelace");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Organisation",
        }) as HTMLInputElement
      ).value,
    ).toBe("Example Financial Services");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Which agent workflow are you responsible for?",
        }) as HTMLTextAreaElement
      ).value,
    ).toBe("Payments operations");
  });
});
