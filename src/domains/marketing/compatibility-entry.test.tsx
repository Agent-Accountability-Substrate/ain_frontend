import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CompatibilityEntry } from "@/domains/marketing/compatibility-entry";

type ObserverCallback = (
  entries: { isIntersecting: boolean; target: Element }[],
) => void;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CompatibilityEntry", () => {
  it("reveals the ecosystem once it enters the viewport", () => {
    const observed: Element[] = [];
    let fire: ObserverCallback = () => undefined;
    const disconnectSpy = vi.fn();

    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: ObserverCallback) {
          fire = callback;
        }
        observe(element: Element) {
          observed.push(element);
        }
        disconnect = disconnectSpy;
      },
    );

    render(
      <CompatibilityEntry>
        <p>Compatible systems</p>
      </CompatibilityEntry>,
    );

    const section = screen.getByText("Compatible systems").closest("section");
    expect(section?.dataset.entry).toBe("pending");

    act(() => {
      fire(observed.map((target) => ({ isIntersecting: true, target })));
    });

    expect(section?.dataset.entry).toBe("entered");
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("renders statically when reduced motion is requested", () => {
    const observe = vi.fn();

    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observe;
        disconnect() {}
      },
    );

    render(
      <CompatibilityEntry>
        <p>Static compatibility</p>
      </CompatibilityEntry>,
    );

    expect(
      screen.getByText("Static compatibility").closest("section")?.dataset
        .entry,
    ).toBe("entered");
    expect(observe).not.toHaveBeenCalled();
  });
});
