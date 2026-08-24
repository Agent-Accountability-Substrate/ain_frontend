import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { metadata, SignInScreen } from "@/domains/auth/sign-in-screen";

describe("SignInScreen", () => {
  it("asks for an email and a password", () => {
    render(<SignInScreen />);

    expect(screen.getByLabelText("Work email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDefined();
  });

  it("never submits, so a typed password cannot reach the URL", () => {
    const { container } = render(<SignInScreen />);
    const form = container.querySelector("form");
    const submit = vi.fn();
    form?.addEventListener("submit", submit);

    fireEvent.submit(form as HTMLFormElement);

    // A form with no action submits as a GET to the current URL, which would
    // put the password in the query string, the address bar and every log
    // between here and the proxy. These pages are not wired yet, so the
    // submit is dropped rather than left to the browser's default.
    expect(form?.getAttribute("action")).toBeNull();
    expect(submit.mock.calls[0]?.[0].defaultPrevented).toBe(true);
  });

  it("offers the other two ways in without pretending they work yet", () => {
    render(<SignInScreen />);

    for (const label of ["Passkey", "SSO"]) {
      const button = screen.getByRole("button", { name: label });
      expect(button.getAttribute("type")).toBe("button");
    }
  });

  it("links to sign-up and back to the landing page", () => {
    render(<SignInScreen />);

    expect(
      screen
        .getByRole("link", { name: "Create your account" })
        .getAttribute("href"),
    ).toBe("/signup");
    expect(
      screen
        .getByRole("link", { name: "Subra AIN Registry" })
        .getAttribute("href"),
    ).toBe("/");
  });

  it("gives every control a pointer cursor", () => {
    render(<SignInScreen />);

    // Browsers default <button> to `cursor: default`; the design has all of
    // these reading as clickable.
    for (const button of screen.getAllByRole("button")) {
      expect(button.className).toContain("cursor-pointer");
    }
  });

  it("carries the head the mockup declared, ready for when it is served", () => {
    // A component cannot export page metadata, so this is inert until a
    // `page.tsx` re-exports it.
    expect(metadata.title).toBe("Sign in");
    expect(metadata.openGraph?.title).toBe("Sign in · Subra");
    // Neither screen has anything to gain from a search result.
    expect(metadata.robots).toMatchObject({ index: false });
  });

  it("underlines the links the design underlines", () => {
    const { container } = render(<SignInScreen />);

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
