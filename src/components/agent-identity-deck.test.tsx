import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentIdentityDeck } from "@/components/agent-identity-deck";

describe("AgentIdentityDeck", () => {
  it("renders three sharp agent cards with the first identity active", () => {
    render(<AgentIdentityDeck />);

    const paymentsCard = screen.getByLabelText(
      "Payments Operations Agent v1 identity card",
    );
    const customerCard = screen.getByLabelText(
      "Payments Operations Agent v2 identity card",
    );
    const vendorCard = screen.getByLabelText(
      "Payments Operations Agent v3 identity card",
    );

    expect(screen.getAllByText("Sample record")).toHaveLength(4);
    screen.getByText("Payments Operations Agent v1 selected");
    expect(paymentsCard.getAttribute("aria-current")).toBe("true");
    expect(paymentsCard.getAttribute("data-position")).toBe("active");
    expect(customerCard.getAttribute("data-position")).toBe("next");
    expect(vendorCard.getAttribute("data-position")).toBe("previous");
    screen.getByRole("button", {
      name: "View registered record for Payments Operations Agent v1",
    });
    screen.getByRole("button", {
      name: "Show Payments Operations Agent v2",
    });
    expect(
      screen.queryByRole("button", { name: "Show next agent" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Show previous agent" }),
    ).toBeNull();
  });

  it("flips the active card to its complete registered-agent record", () => {
    render(<AgentIdentityDeck />);

    const paymentsCard = screen.getByLabelText(
      "Payments Operations Agent v1 identity card",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent v1",
      }),
    );

    expect(paymentsCard.getAttribute("data-flipped")).toBe("true");
    screen.getByRole("heading", {
      name: "Agent accountability passport",
    });
    // The identifier is byte-identical on every card. That IS the permanence
    // claim, shown rather than asserted. So it appears three times, and the
    // organisation segment is EXAMPLE-ORG rather than a plausible ULID.
    expect(
      screen.getAllByText("did:ain:gb:EXAMPLE-ORG:01BX5ZZKBKACTAV9WEVGEMMVRZ"),
    ).toHaveLength(3);
    expect(screen.getAllByText("key-example-a1")).toHaveLength(3);
    screen.getByText("Signed 4 Mar 2026");

    // v1 carries one scope. The scope growing under a fixed identifier is
    // what the deck exists to show, so v1 must NOT already list the refund
    // permission that v2 introduces.
    const scopeV1 = screen.getByRole("list", {
      name: "Payments Operations Agent v1 scope",
    });
    within(scopeV1).getByText("payments.initiate");
    expect(within(scopeV1).queryByText("payments.refund")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show v1 of Payments Operations Agent",
      }),
    );
    expect(paymentsCard.getAttribute("data-flipped")).toBe("false");
  });

  it("makes every card face clickable for selection and flipping", () => {
    render(<AgentIdentityDeck />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent v1",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Show Payments Operations Agent v2",
      }),
    );

    const customerCard = screen.getByLabelText(
      "Payments Operations Agent v2 identity card",
    );
    expect(customerCard.getAttribute("aria-current")).toBe("true");
    expect(customerCard.getAttribute("data-flipped")).toBe("false");
    screen.getByText("Payments Operations Agent v2 selected");

    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent v2",
      }),
    );
    expect(customerCard.getAttribute("data-flipped")).toBe("true");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show v2 of Payments Operations Agent",
      }),
    );
    expect(customerCard.getAttribute("data-flipped")).toBe("false");

    fireEvent.click(
      screen.getByRole("button", { name: "Show Payments Operations Agent v3" }),
    );
    expect(
      screen
        .getByLabelText("Payments Operations Agent v3 identity card")
        .getAttribute("aria-current"),
    ).toBe("true");
  });

  it("tracks pointer light only on the active card, then resets", () => {
    render(<AgentIdentityDeck />);

    const activeCard = screen.getByLabelText(
      "Payments Operations Agent v1 identity card",
    );
    const inactiveCard = screen.getByLabelText(
      "Payments Operations Agent v2 identity card",
    );

    vi.spyOn(activeCard, "getBoundingClientRect").mockReturnValue({
      bottom: 496,
      height: 496,
      left: 0,
      right: 384,
      top: 0,
      width: 384,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    });

    fireEvent.pointerMove(inactiveCard, { clientX: 100, clientY: 100 });
    expect(inactiveCard.style.getPropertyValue("--glow-x")).toBe("");

    fireEvent.pointerMove(activeCard, { clientX: 288, clientY: 124 });
    expect(activeCard.style.getPropertyValue("--glow-x")).toBe("75%");
    expect(activeCard.style.getPropertyValue("--glow-y")).toBe("25%");

    fireEvent.pointerLeave(activeCard);
    expect(activeCard.style.getPropertyValue("--glow-x")).toBe("50%");
    expect(activeCard.style.getPropertyValue("--glow-y")).toBe("34%");
  });
});
