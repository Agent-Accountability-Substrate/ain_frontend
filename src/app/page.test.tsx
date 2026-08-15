import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

// The sign-in button wraps a server action; mock it so the component tree
// renders without pulling the server-only auth module into jsdom.
vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("home page", () => {
  it("leads with a static headline, never a rotating one", () => {
    const { container } = render(<HomePage />);

    screen.getByRole("heading", {
      level: 1,
      name: "The accountability register for autonomous agents.",
    });

    expect(container.querySelector(".hero-proof-word")).toBeNull();
  });

  it("keeps the proposition on screen at every width", () => {
    const { container } = render(<HomePage />);

    // A breakpoint-hidden subline costs every phone visitor the proposition
    // and leaves them the headline alone, so nothing in the hero may carry
    // one.
    const lead = screen.getByText(
      /Every action an agent takes can be traced to the authority/,
    );
    expect(lead.className).not.toMatch(/(^|\s)hidden(\s|$)/);

    const hidden = [
      ...(container.querySelector(".hero-proof-copy")?.querySelectorAll("*") ??
        []),
    ].filter((node) => /(^|\s)hidden(\s|$)/.test(node.className.toString()));
    expect(hidden).toHaveLength(0);
  });

  it("keeps hero copy inside the measured word budget", () => {
    const { container } = render(<HomePage />);

    // Hero content across the same ten sites: median 31 words, maximum 46
    // (Vault). This block ran to 64 before the resolver strip and the duplicate
    // scarcity line came out.
    const copy = container.querySelector(".hero-proof-copy");
    const words = (copy?.textContent ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    expect(words).toBeLessThanOrEqual(46);
  });

  it("spends no hero words on a term of art", () => {
    const { container } = render(<HomePage />);

    // "The resolver answers these separately" landed three seconds in, before
    // the reader had any referent for "resolver". Step 03 introduces the idea
    // in plain words instead.
    const copy = container.querySelector(".hero-proof-copy");

    expect(copy?.textContent).not.toMatch(/resolver/i);
  });

  it("routes every ask to somewhere that answers", () => {
    render(<HomePage />);

    // Under a private preview, access is the scarce thing and the firm is
    // asking to be let in, so "Request access" states the position rather
    // than apologising for it. Both instances scroll to the footer form.
    const asks = screen.getAllByRole("link", { name: "Request access" });
    expect(asks.map((a) => a.getAttribute("href"))).toEqual(["#talk", "#talk"]);

    // Two mailto exits, both to the same address: the closing section and the
    // footer links.
    const exits = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("mailto:"));
    expect(exits).toEqual([
      "mailto:contact@subrahq.com?subject=AIN%20Registry",
      "mailto:contact@subrahq.com?subject=AIN%20Registry",
    ]);

    expect(
      screen
        .getByRole("link", { name: "What a record contains" })
        .getAttribute("href"),
    ).toBe("#record");
  });

  it("states the stage at most once, and never in the hero", () => {
    render(<HomePage />);

    expect(
      screen.queryByText(/Now onboarding our founding design partner/),
    ).toBeNull();

    // Manufactured scarcity is the obvious failure mode and regulated buyers
    // are trained to spot it. The subtler one is volunteering weakness.
    expect(screen.queryByText(/limited (spots|slots)/i)).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    expect(screen.queryByText(/not generally available/i)).toBeNull();
  });

  it("carries the pre-nav band naming residency and the runtime boundary", () => {
    render(<HomePage />);

    screen.getByText(
      /Built for UK regulated firms\. Never in your agents’ runtime path\./,
    );
  });

  it("closes on the ask, and carries the form into the footer", () => {
    render(<HomePage />);

    screen.getByRole("button", { name: "Start now" });

    // One field, submitted through a server action, so the ask works whether
    // or not the visitor has a mail client configured.
    screen.getByRole("button", { name: "Request access" });
    screen.getByLabelText("Work email");
  });

  it("reads as a complete argument from the section headings alone", () => {
    render(<HomePage />);

    // The corpus's own validation test: strip every paragraph and image, read
    // the section headings in order. If that is not a complete pitch, the page
    // fails for the ~79% of readers who only scan.
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);

    expect(headings).toEqual([
      "Four fields, held permanently.",
      "A widened scope is a new version, not an edit.",
      "One record, signed once, answerable later.",
      "One identifier. Every version it has ever had.",
      "We record what your agents did. We never decide what they may do.",
      "A record you can argue with is not evidence.",
      "What firms ask first.",
      "Register the agent before you have to explain it.",
    ]);
  });

  it("spends the ruled eyebrow sparingly", () => {
    const { container } = render(<HomePage />);

    // A hairline at every section boundary reads as compression — that was the
    // state this guards against. It opens the page and opens the argument, and
    // stops there; the remaining sections take a plain eyebrow.
    const sections = container.querySelectorAll("main section").length;
    const ruled = container.querySelectorAll("main .h-px.flex-1").length;

    expect(ruled).toBeLessThanOrEqual(2);
    expect(ruled).toBeLessThan(sections / 2);
    expect(
      container.querySelector(".hero-proof-copy .h-px.flex-1"),
    ).not.toBeNull();
  });

  it("opens on the artifact, not on an argument for wanting one", () => {
    render(<HomePage />);
    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent ?? "");

    const questions = headings.findIndex((h) => h.startsWith("What firms ask"));
    const ask = headings.findIndex((h) => h.startsWith("Register the agent"));
    expect(questions).toBe(ask - 1);
  });
});
