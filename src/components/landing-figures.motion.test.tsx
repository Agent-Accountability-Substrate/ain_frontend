import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Only the ticker is stubbed, so each component's own render function runs for
// real — the ticker is plumbing, and its wall clock is the one thing a test
// cannot wait on.
const { frames } = vi.hoisted(() => ({
  frames: [] as ((time: number, delta: number) => void)[],
}));

vi.mock("gsap", () => ({
  default: {
    ticker: {
      add: (fn: (time: number, delta: number) => void) => frames.push(fn),
      remove: () => {},
    },
  },
}));

import { AinDelegationDiagram } from "@/components/ain-delegation-diagram";

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let fire: ObserverCallback | undefined;

function stubObserver(reduced = false) {
  class FakeObserver {
    constructor(callback: ObserverCallback) {
      fire = callback;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
}

function advance(seconds: number) {
  const steps = Math.round(seconds / 0.05);
  for (let i = 0; i < steps; i += 1) {
    for (const frame of frames) frame(0, 50);
  }
}

afterEach(() => {
  fire = undefined;
  frames.length = 0;
  vi.unstubAllGlobals();
});

describe("AinDelegationDiagram motion", () => {
  it("leaves every block on screen for the whole cycle", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);
    const blocks = [
      ...container.querySelectorAll<SVGElement>(
        "[data-dl-person], [data-dl-record], [data-dl-related]",
      ),
    ];
    expect(blocks).toHaveLength(4);

    fire?.([{ isIntersecting: true }]);

    // Cards that fade in and out are the frustrating half of a looping figure:
    // a reader arriving mid-cycle should find the whole scene, always.
    for (const at of [0.2, 1.5, 5, 8.5]) {
      advance(at);
      for (const block of blocks) {
        expect(block.style.clipPath).toBe("");
        expect(block.style.opacity === "" || block.style.opacity === "1").toBe(
          true,
        );
      }
    }
  });

  it("keeps both lines drawn, and lights one once its packet lands", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);
    const edge = container.querySelector('[data-dl-edge="bind"]');
    const base = edge?.querySelector<SVGPathElement>("[data-dl-base]");
    const settled = edge?.querySelector<SVGElement>("[data-dl-settled]");

    fire?.([{ isIntersecting: true }]);

    // The line is geometry, not an animation: full length from the first
    // frame and never redrawn.
    advance(0.3);
    expect(base?.getAttribute("d")).toBe("M250 221 L396 221");
    expect(settled?.style.opacity).toBe("0");

    // The packet lands at 1.15 reference units — 1.92s — after which the
    // accent overlay stays lit, which is how a made relationship reads.
    advance(2);
    expect(base?.getAttribute("d")).toBe("M250 221 L396 221");
    expect(settled?.style.opacity).toBe("1");
  });

  it("runs a packet along the binding, once", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);
    const head = container
      .querySelector('[data-dl-edge="bind"]')
      ?.querySelector<SVGElement>("[data-dl-head]");

    fire?.([{ isIntersecting: true }]);

    advance(1.2);
    expect(head?.style.opacity).toBe("1");
    const early = head?.getAttribute("x");

    advance(0.35);
    expect(head?.getAttribute("x")).not.toBe(early);

    // The bind is made once. A packet still shuttling afterwards would read as
    // traffic, which is the one thing this figure must not imply.
    advance(1.5);
    expect(head?.style.opacity).toBe("0");
  });

  it("revokes the referenced identity live, rather than starting it dead", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);
    const card = container.querySelector<SVGElement>("[data-dl-revocable]");
    const bar = container.querySelector<SVGElement>("[data-dl-revocable-bar]");
    const note = container.querySelector<SVGElement>("[data-dl-revoked-note]");

    fire?.([{ isIntersecting: true }]);

    // Alive: full card, filled bar, no stamp. Withdrawal is at 4.6 reference
    // units — 7.7s — so there is a long stretch where it is plainly live.
    advance(7);
    expect(card?.style.opacity).toBe("1");
    expect(bar?.getAttribute("width")).toBe(bar?.dataset["dlW"]);
    expect(note?.style.opacity).toBe("0");

    // Dead: dimmed, drained, stamped, and the edge marked where the reference
    // was held rather than along it.
    advance(2);
    expect(Number(card?.style.opacity)).toBeLessThan(1);
    expect(Number(bar?.getAttribute("width"))).toBe(0);
    expect(note?.style.opacity).toBe("1");
    expect(
      container.querySelector<SVGElement>("[data-dl-withdrawn]")?.style.opacity,
    ).not.toBe("0");
  });

  it("draws an edge only where the register holds a relationship", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);

    // Two edges for two real relationships: the role bound into the document,
    // and the external identity it references. The second agent is registered
    // independently and the schema records no link to it, so it gets none.
    expect(container.querySelectorAll("[data-dl-related]")).toHaveLength(2);
    expect(container.querySelectorAll("[data-dl-edge]")).toHaveLength(2);
    expect(container.querySelectorAll('[data-dl-edge="bind"]')).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-dl-edge="reference"]'),
    ).toHaveLength(1);
  });

  it("fills each neighbour's own scope, and drains only the revoked one", () => {
    stubObserver();
    const { container } = render(<AinDelegationDiagram />);
    const bars = [...container.querySelectorAll<SVGElement>("[data-dl-bar]")];
    const revocable = bars.filter((b) =>
      b.hasAttribute("data-dl-revocable-bar"),
    );
    const kept = bars.filter((b) => !b.hasAttribute("data-dl-revocable-bar"));

    fire?.([{ isIntersecting: true }]);

    const full = (b: SVGElement) =>
      b.getAttribute("width") === b.dataset["dlW"];

    advance(7);
    expect(kept.every(full)).toBe(true);
    expect(revocable.every(full)).toBe(true);

    // Losing the reference empties that record's scope and leaves every other
    // one untouched.
    advance(2);
    expect(kept.every(full)).toBe(true);
    expect(revocable.every((b) => Number(b.getAttribute("width")) === 0)).toBe(
      true,
    );
  });

  it("claims no hand-off between agents", () => {
    const { container } = render(<AinDelegationDiagram />);
    const described =
      container.querySelector("svg")?.getAttribute("aria-label") ?? "";

    // There is no parent, child or delegation relationship in the schema, so
    // nothing here may imply one.
    for (const claim of [
      /handed work/i,
      /narrower than parent/i,
      /delegat/i,
      /authority withdrawn/i,
      /countersign/i,
    ]) {
      expect(described).not.toMatch(claim);
      expect(container.textContent ?? "").not.toMatch(claim);
    }
  });

  it("renders the settled state once under reduced motion", () => {
    stubObserver(true);
    const { container } = render(<AinDelegationDiagram />);
    const note = container.querySelector<SVGElement>("[data-dl-revoked-note]");

    // Rendered once, at a point late enough that every timed thing has
    // resolved: the binding lit, the classes filled, the reference withdrawn.
    // The blocks need no help — the render never touches them.
    expect(frames).toHaveLength(0);
    expect(note?.style.opacity).toBe("1");
    expect(
      container
        .querySelector('[data-dl-edge="bind"]')
        ?.querySelector<SVGElement>("[data-dl-settled]")?.style.opacity,
    ).toBe("1");
    const chip = container.querySelector<SVGElement>("[data-dl-scope-fill]");
    expect(chip?.getAttribute("width")).toBe(chip?.dataset["dlW"]);
  });
});
