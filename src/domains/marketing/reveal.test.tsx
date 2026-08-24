import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Reveal, RevealHeading } from "@/domains/marketing/reveal";

type ObserverCallback = (
  entries: { isIntersecting: boolean; target: Element }[],
) => void;

/** Captures the observer so a test can drive the intersection itself. */
function stubObserver() {
  const observed: Element[] = [];
  let fire: ObserverCallback = () => undefined;

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: ObserverCallback) {
        fire = callback;
      }
      observe(element: Element) {
        observed.push(element);
      }
      unobserve() {}
      disconnect() {}
    },
  );

  return {
    observed,
    enter: () =>
      act(() => {
        fire(observed.map((target) => ({ isIntersecting: true, target })));
      }),
  };
}

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("renders its children with nothing hidden before the observer runs", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    render(<Reveal>Signed · v9 in force</Reveal>);

    // The hiding class is added by the effect, never rendered by the server.
    // Without JavaScript there is nothing to un-hide it, so the copy has to
    // arrive visible or a visitor with a blocked bundle sees an empty page.
    const node = screen.getByText("Signed · v9 in force");
    expect(node.className).not.toContain("site-reveal");
  });

  it("hides then reveals once the element comes into view", () => {
    stubReducedMotion(false);
    const observer = stubObserver();

    render(<Reveal>Scope diff</Reveal>);
    const node = screen.getByText("Scope diff");
    expect(node.className).toContain("site-reveal-block");

    observer.enter();
    expect(node.className).toContain("is-in");
  });

  it("does nothing at all when reduced motion is asked for", () => {
    stubReducedMotion(true);
    stubObserver();

    render(<Reveal>Scope diff</Reveal>);

    expect(screen.getByText("Scope diff").className).not.toContain(
      "site-reveal",
    );
  });

  it("renders as the tag the caller asks for, so a table row stays a table row", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(
      <table>
        <tbody>
          <Reveal as="tr">
            <td>1 · registered</td>
          </Reveal>
        </tbody>
      </table>,
    );

    // Wrapping a <td> in a <div> would make the browser hoist it out of the
    // table, which silently destroys the chain layout.
    expect(container.querySelector("tbody > tr > td")).not.toBeNull();
  });
});

describe("RevealHeading", () => {
  it("renders the whole heading as one readable string", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    render(<RevealHeading lead="Every version it" accent="has ever had." />);

    // Split into per-word spans for the animation, so the guarantee worth
    // testing is that a screen reader and a search engine still read a sentence.
    expect(screen.getByRole("heading").textContent).toBe(
      "Every version it has ever had.",
    );
  });

  it("renders an h1 when asked and an h2 by default", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { rerender } = render(<RevealHeading lead="Default" />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();

    rerender(<RevealHeading level={1} lead="Promoted" />);
    expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  });

  it("puts the accent on the accented half only", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(
      <RevealHeading lead="What firms" accent="ask first." />,
    );

    const accented = Array.from(
      container.querySelectorAll(".text-site-accent"),
    ).map((node) => node.textContent);
    expect(accented).toEqual(["ask", "first."]);
  });

  it("staggers the words when they come into view", () => {
    stubReducedMotion(false);
    const observer = stubObserver();

    const { container } = render(<RevealHeading lead="One two three" />);
    observer.enter();

    const parts = container.querySelectorAll("[data-reveal-part]");
    expect(parts.length).toBe(3);
    expect((parts[0] as HTMLElement).style.transitionDelay).toBe("0ms");
    expect((parts[2] as HTMLElement).style.transitionDelay).toBe("84ms");
  });
});
