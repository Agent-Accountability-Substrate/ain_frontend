import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PassportDeck } from "@/domains/marketing/passport-deck";
import { PASSPORT_VERSIONS } from "@/domains/marketing/landing-content";

/** The card for a given version, found by the label printed on it. */
function card(version: string) {
  return (
    Array.from(document.querySelectorAll("article")).find((article) =>
      article.textContent?.includes(`${version} ·`),
    ) ?? null
  );
}

describe("PassportDeck", () => {
  it("deals the version in force to the front", () => {
    render(<PassportDeck />);

    const active = document.querySelector('[data-position="active"]');
    // The newest version is the one the page is making a claim about; the
    // history is behind it.
    expect(active?.textContent).toContain("v3");
  });

  it("marks only the version in force as live", () => {
    render(<PassportDeck />);

    const live = document.querySelectorAll('[data-live="true"]');
    expect(live.length).toBe(1);
    expect(live[0]?.textContent).toContain("v3");
  });

  it("restores the original three-version passport treatment", () => {
    const { container } = render(<PassportDeck />);
    const deck = container.querySelector('[data-passport-style="original"]');
    const cards = Array.from(
      deck?.querySelectorAll<HTMLElement>(".pass") ?? [],
    );

    expect(deck).not.toBeNull();
    expect(cards.map((item) => item.style.getPropertyValue("--pa"))).toEqual([
      "#76A2FF",
      "#74D6A2",
      "#B6A2FF",
    ]);
  });

  it("brings a card behind to the front when it is clicked", () => {
    render(<PassportDeck />);

    fireEvent.click(
      screen.getByRole("button", { name: /Bring v1 to the front/ }),
    );

    expect(
      document.querySelector('[data-position="active"]')?.textContent,
    ).toContain("v1");
  });

  it("turns the front card over when it is clicked again", () => {
    render(<PassportDeck />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Turn over v3 to see the full registered agent record/,
      }),
    );

    expect(card("v3")?.getAttribute("data-flipped")).toBe("true");
  });

  it("lands a newly promoted card face up", () => {
    render(<PassportDeck />);

    // Flip the front one, then promote another: arriving mid-flip would show
    // the back of a card the reader has not turned over.
    fireEvent.click(screen.getByRole("button", { name: /Turn over v3/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Bring v1 to the front/ }),
    );

    expect(card("v1")?.getAttribute("data-flipped")).toBe("false");
  });

  it("gives every card a button that says what clicking it will do", () => {
    render(<PassportDeck />);

    // The cards are the only way through this section, so the deck has to be
    // navigable and legible without seeing the animation at all.
    expect(screen.getAllByRole("button").length).toBe(PASSPORT_VERSIONS.length);
    expect(
      screen.getByRole("button", { name: /Bring v2 to the front/ }),
    ).toBeDefined();
  });

  it("keeps the turned-away face out of the accessibility tree", () => {
    render(<PassportDeck />);

    // `backface-visibility` hides the turned-away face's pixels and nothing
    // else. Unmarked, a reader is read all three fronts and all three nine-row
    // records in sequence, and the button offering to turn a card over then
    // changes nothing it can perceive.
    expect(screen.queryAllByRole("term")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Turn over v3/ }));

    // Turned over, exactly one record is readable: the one now facing out.
    expect(screen.getAllByRole("term")).toHaveLength(
      PASSPORT_VERSIONS.at(-1)?.record.length ?? 0,
    );
  });

  it("keeps the permanent identifier the same across every version", () => {
    render(<PassportDeck />);

    const identifiers = new Set(
      PASSPORT_VERSIONS.map((version) => version.ain),
    );
    // The whole point of the section: the scope and the accountable role move,
    // the identifier does not.
    expect(identifiers.size).toBe(1);
  });

  it("shows the accountable role changing at the latest version", () => {
    const roles = PASSPORT_VERSIONS.map((version) => version.accountable);
    expect(roles[0]).toBe(roles[1]);
    expect(roles[2]).not.toBe(roles[1]);
  });
});

describe("PassportDeck · the specular light", () => {
  function activeCard() {
    return document.querySelector('[data-position="active"]') as HTMLElement;
  }

  it("tracks the pointer across the card in front", () => {
    render(<PassportDeck />);
    const card = activeCard();
    card.getBoundingClientRect = () =>
      ({ left: 100, top: 200, width: 400, height: 500 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 300, clientY: 450 });

    // The light is the single thing that most makes the card read as a
    // physical object rather than a flat panel.
    expect(card.style.getPropertyValue("--glow-x")).toBe("50.0%");
    expect(card.style.getPropertyValue("--glow-y")).toBe("50.0%");
  });

  it("returns the light to rest when the pointer leaves", () => {
    render(<PassportDeck />);
    const card = activeCard();
    card.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 500 }) as DOMRect;

    fireEvent.pointerMove(card, { clientX: 40, clientY: 60 });
    fireEvent.pointerLeave(card);

    // Not left wherever the pointer happened to exit — the resting position is
    // part of the card's look, not an accident of the last mouse position.
    expect(card.style.getPropertyValue("--glow-x")).toBe("50%");
    expect(card.style.getPropertyValue("--glow-y")).toBe("34%");
  });
});
