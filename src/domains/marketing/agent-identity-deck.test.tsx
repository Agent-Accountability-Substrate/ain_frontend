import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentIdentityDeck } from "@/domains/marketing/agent-identity-deck";

describe("AgentIdentityDeck", () => {
  it("uses decorative tablet chrome around the semantic passport section", () => {
    render(<AgentIdentityDeck />);

    const frame = screen.getByTestId("agent-tablet-frame");
    const section = screen.getByRole("region", {
      name: "One registry. A distinct passport for every agent.",
    });
    const camera = frame.querySelector(".agent-tablet-camera");

    expect(frame.classList.contains("agent-tablet-frame")).toBe(true);
    expect(section.classList.contains("agent-tablet-screen")).toBe(true);
    expect(frame.contains(section)).toBe(true);
    expect(camera?.getAttribute("aria-hidden")).toBe("true");
  });

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

    expect(screen.queryByText(/illustrative demo data/i)).toBeNull();
    expect(screen.queryByText("AIN Registry")).toBeNull();
    expect(screen.getAllByText("Subra").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Payments Operations Agent selected"),
    ).toBeDefined();
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

  it("separates the passport deck from its centered copy without interaction instructions", () => {
    render(<AgentIdentityDeck />);

    const title = screen.getByRole("heading", {
      name: "One registry. A distinct passport for every agent.",
    });
    const copy = title.parentElement;

    expect(copy?.classList.contains("border-t")).toBe(true);
    expect(screen.queryByText(/tap or click any card/i)).toBeNull();
  });

  it("flips the active card to its complete registered-agent record", () => {
    render(<AgentIdentityDeck />);

    const paymentsCard = screen.getByLabelText(
      "Payments Operations Agent identity card",
    );
    const frontTrigger = screen.getByRole("button", {
      name: "View registered record for Payments Operations Agent",
    });
    fireEvent.click(frontTrigger);

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
    expect(paymentsCard.contains(frontTrigger)).toBe(true);

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

  it("selects and flips cards from direct touch taps without treating swipes as taps", () => {
    render(<AgentIdentityDeck />);

    const customerCard = screen.getByLabelText(
      "Customer Communications Agent identity card",
    );
    const customerTrigger = screen.getByRole("button", {
      name: "Show Customer Communications Agent",
    });

    fireEvent.touchStart(customerTrigger, {
      touches: [{ identifier: 1, clientX: 250, clientY: 240 }],
    });
    fireEvent.touchEnd(customerTrigger, {
      changedTouches: [{ identifier: 1, clientX: 253, clientY: 244 }],
    });

    expect(customerCard.getAttribute("aria-current")).toBe("true");
    expect(customerCard.getAttribute("data-flipped")).toBe("false");

    const activeCustomerTrigger = screen.getByRole("button", {
      name: "View registered record for Customer Communications Agent",
    });
    fireEvent.touchStart(activeCustomerTrigger, {
      touches: [{ identifier: 2, clientX: 180, clientY: 260 }],
    });
    fireEvent.touchEnd(activeCustomerTrigger, {
      changedTouches: [{ identifier: 2, clientX: 182, clientY: 263 }],
    });

    expect(customerCard.getAttribute("data-flipped")).toBe("true");

    const backTrigger = screen.getByRole("button", {
      name: "Show identity card for Customer Communications Agent",
    });
    fireEvent.touchStart(backTrigger, {
      touches: [{ identifier: 3, clientX: 180, clientY: 260 }],
    });
    fireEvent.touchEnd(backTrigger, {
      changedTouches: [{ identifier: 3, clientX: 180, clientY: 310 }],
    });

    expect(customerCard.getAttribute("data-flipped")).toBe("true");
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

    fireEvent.pointerMove(inactiveCard, {
      clientX: 100,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(inactiveCard.style.getPropertyValue("--glow-x")).toBe("");

    fireEvent.pointerMove(activeCard, {
      clientX: 288,
      clientY: 124,
      pointerType: "mouse",
    });
    expect(activeCard.style.getPropertyValue("--glow-x")).toBe("75%");
    expect(activeCard.style.getPropertyValue("--glow-y")).toBe("25%");

    fireEvent.pointerMove(activeCard, {
      clientX: 20,
      clientY: 20,
      pointerType: "touch",
    });
    expect(activeCard.style.getPropertyValue("--glow-x")).toBe("75%");
    expect(activeCard.style.getPropertyValue("--glow-y")).toBe("25%");

    fireEvent.pointerLeave(activeCard);
    expect(activeCard.style.getPropertyValue("--glow-x")).toBe("50%");
    expect(activeCard.style.getPropertyValue("--glow-y")).toBe("34%");
  });
});
