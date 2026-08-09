import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentIdentityDeck } from "@/components/agent-identity-deck";

describe("AgentIdentityDeck", () => {
  it("renders three sharp agent cards with the first identity active", () => {
    render(<AgentIdentityDeck />);

    const paymentsCard = screen.getByLabelText(
      "Payments Operations Agent identity card",
    );
    const customerCard = screen.getByLabelText(
      "Customer Communications Agent identity card",
    );
    const vendorCard = screen.getByLabelText(
      "Vendor Risk Review Agent identity card",
    );

    expect(screen.getAllByText("Illustrative demo data")).toHaveLength(4);
    expect(screen.getByText("Payments Operations Agent selected")).toBeDefined();
    expect(paymentsCard.getAttribute("aria-current")).toBe("true");
    expect(paymentsCard.getAttribute("data-position")).toBe("active");
    expect(customerCard.getAttribute("data-position")).toBe("next");
    expect(vendorCard.getAttribute("data-position")).toBe("previous");
    expect(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent",
      }),
    ).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: "Show Customer Communications Agent",
      }),
    ).toBeDefined();
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
      "Payments Operations Agent identity card",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent",
      }),
    );

    expect(paymentsCard.getAttribute("data-flipped")).toBe("true");
    expect(
      screen.getByRole("heading", {
        name: "Agent accountability passport",
      }),
    ).toBeDefined();
    expect(
      screen.getByText(
        "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ",
      ),
    ).toBeDefined();
    expect(screen.getByText("key-demo-7F3A91C2")).toBeDefined();
    expect(screen.getByText("23 Jul 2026, 11:42 BST")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Copy permanent AIN" }),
    ).toBeDefined();

    const scope = screen.getByRole("list", {
      name: "Payments Operations Agent scope",
    });
    expect(within(scope).getByText("payments.initiate")).toBeDefined();
    expect(within(scope).getByText("customer_comms.send")).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show identity card for Payments Operations Agent",
      }),
    );
    expect(paymentsCard.getAttribute("data-flipped")).toBe("false");
  });

  it("makes every card face clickable for selection and flipping", () => {
    render(<AgentIdentityDeck />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Payments Operations Agent",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Show Customer Communications Agent",
      }),
    );

    const customerCard = screen.getByLabelText(
      "Customer Communications Agent identity card",
    );
    expect(customerCard.getAttribute("aria-current")).toBe("true");
    expect(customerCard.getAttribute("data-flipped")).toBe("false");
    expect(
      screen.getByText("Customer Communications Agent selected"),
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole("button", {
        name: "View registered record for Customer Communications Agent",
      }),
    );
    expect(customerCard.getAttribute("data-flipped")).toBe("true");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show identity card for Customer Communications Agent",
      }),
    );
    expect(customerCard.getAttribute("data-flipped")).toBe("false");

    fireEvent.click(
      screen.getByRole("button", { name: "Show Vendor Risk Review Agent" }),
    );
    expect(
      screen
        .getByLabelText("Vendor Risk Review Agent identity card")
        .getAttribute("aria-current"),
    ).toBe("true");
  });

  it("tracks pointer light only on the active card, then resets", () => {
    render(<AgentIdentityDeck />);

    const activeCard = screen.getByLabelText(
      "Payments Operations Agent identity card",
    );
    const inactiveCard = screen.getByLabelText(
      "Customer Communications Agent identity card",
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
