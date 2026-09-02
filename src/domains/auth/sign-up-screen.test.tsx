import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { metadata, SignUpScreen } from "@/domains/auth/sign-up-screen";

describe("SignUpScreen", () => {
  it("asks for the three things an account needs", () => {
    render(<SignUpScreen />);

    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Full name")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Create account" }),
    ).toBeDefined();
  });

  it("requires the terms to be accepted", () => {
    const { container } = render(<SignUpScreen />);

    const terms = container.querySelector('input[name="terms"]');
    expect(terms?.hasAttribute("required")).toBe(true);
  });

  it("never submits, so a typed password cannot reach the URL", () => {
    const { container } = render(<SignUpScreen />);
    const form = container.querySelector("form");
    const submit = vi.fn();
    form?.addEventListener("submit", submit);

    fireEvent.submit(form as HTMLFormElement);

    expect(form?.getAttribute("action")).toBeNull();
    expect(submit.mock.calls[0]?.[0].defaultPrevented).toBe(true);
  });

  it("says the password never reaches the register", () => {
    render(<SignUpScreen />);

    // The one claim on this page that is about the product rather than the
    // form, and the reason a regulated buyer reads it at all.
    expect(screen.getByText(/never touches the register itself/)).toBeDefined();
  });

  it("points at the demo request and at sign-in", () => {
    render(<SignUpScreen />);

    expect(
      screen.getByRole("link", { name: "book a demo" }).getAttribute("href"),
    ).toBe("/#request");
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/signin");
  });

  it("shows the passport rather than a dashboard", () => {
    render(<SignUpScreen />);

    // What the account is actually for, and the same object the landing page
    // spends its longest section on.
    expect(screen.getByText("Payments Operations Agent")).toBeDefined();
    expect(screen.getByText("Head of Operational Resilience")).toBeDefined();
  });

  it("carries the head the mockup declared, ready for when it is served", () => {
    // A component cannot export page metadata, so this is inert until a
    // `page.tsx` re-exports it.
    expect(metadata.title).toBe("Sign up");
    expect(metadata.openGraph?.title).toBe("Create your account · Subra");
    // Neither screen has anything to gain from a search result.
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("underlines the links the design underlines", () => {
    const { container } = render(<SignUpScreen />);

    // Tailwind's Preflight sets `a { text-decoration: inherit }`, which
    // resolves to none — so `underline-offset` on its own styles an underline
    // that is never drawn. Every link on these screens is underlined in the
    // mockup; none of its rules sets `text-decoration: none`.
    // The wordmark is the exception, and the mockup says so explicitly:
    // `.brand { text-decoration: none }`. It is a logo, not prose.
    const links = [...container.querySelectorAll("a")].filter(
      (a) => a.getAttribute("aria-label") !== "Subra AIN Registry",
    );
    expect(links.length).toBeGreaterThan(0);
    expect(
      links
        .filter((a) => !a.className.includes("underline"))
        .map((a) => a.textContent),
    ).toEqual([]);
  });
});
