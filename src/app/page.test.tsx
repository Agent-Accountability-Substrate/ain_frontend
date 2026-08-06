import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";

// The sign-in button wraps a server action; mock it so the component tree
// renders without pulling the server-only auth module into jsdom.
vi.mock("@/lib/auth-actions", () => ({
  signInAction: vi.fn(),
  signOutAction: vi.fn(),
}));

describe("home page", () => {
  it("renders the product-led hero and sign-in actions", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Prove which AI agent acted, what it was allowed to do/,
      }),
    ).toBeDefined();
    expect(
      screen.getByText(
        /Give every consequential agent a permanent identity/,
      ),
    ).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: "Sign in" }),
    ).toHaveLength(2);
    expect(screen.getByTestId("hero-evidence-field")).toBeDefined();
    expect(
      screen.getByTestId("hero-evidence-field").getAttribute("aria-hidden"),
    ).toBe("true");
    const rotatingWord = screen.getByTestId("hero-proof-word");
    expect(rotatingWord.getAttribute("aria-hidden")).toBe("true");
    expect(rotatingWord.getAttribute("data-words")).toBe(
      "accountable.,authorised.,traceable.,verifiable.",
    );
    expect(within(rotatingWord).getByText("accountable.")).toBeDefined();
  });

  it("renders the complete illustrative accountability passport", () => {
    render(<HomePage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent",
      }),
    );

    const passport = screen.getByLabelText(
      "Payments Operations Agent identity card",
    );

    expect(within(passport).getByText("Registered agent record")).toBeDefined();
    expect(
      within(passport).getByText("Agent accountability passport"),
    ).toBeDefined();
    expect(within(passport).getByText("Illustrative demo data")).toBeDefined();
    expect(
      within(passport).getAllByText("Payments Operations Agent").length,
    ).toBeGreaterThan(0);
    expect(
      within(passport).getByText(
        "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ",
      ),
    ).toBeDefined();
    expect(within(passport).getByText("Active")).toBeDefined();
    expect(within(passport).getByText("v3")).toBeDefined();
    expect(within(passport).getByText("EdDSA")).toBeDefined();
    expect(within(passport).getByText("key-demo-7F3A91C2")).toBeDefined();
    expect(
      within(passport).getAllByText("Payments Operations").length,
    ).toBeGreaterThan(0);
    expect(
      within(passport).getByText("23 Jul 2026, 11:42 BST"),
    ).toBeDefined();

    const scope = within(passport).getByRole("list", {
      name: "Payments Operations Agent scope",
    });
    expect(within(scope).getByText("payments.initiate")).toBeDefined();
    expect(within(scope).getByText("customer_comms.send")).toBeDefined();
  });

  it("renders the animated illustrative agent identity deck", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "One registry. A distinct passport for every agent.",
      }),
    ).toBeDefined();
    expect(
      screen.getByLabelText("Illustrative agent identity cards"),
    ).toBeDefined();
    expect(
      screen
        .getByLabelText("Payments Operations Agent identity card")
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent",
      }),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Show next agent" }),
    ).toBeNull();
  });

  it("removes the unrelated forecast, rehabilitation and usage-metric UI", () => {
    render(<HomePage />);

    for (const removedText of [
      "Recovery forecast",
      "Predicted recovery signal",
      "High probability",
      "Load asymmetry",
      "Range of motion",
      "Audit progress",
      "Pause review",
      "Complete session",
    ]) {
      expect(screen.queryByText(removedText)).toBeNull();
    }
    expect(screen.queryByText(/%/)).toBeNull();
  });
});
