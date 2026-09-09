import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

// A fresh object per call, deliberately. `router` is an effect dependency, so
// a watcher whose budget lived in the effect closure would refill it on every
// render — and the bound would only hold while Next happened to return a
// stable router. This mock is what proves it does not depend on that.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { EvidencePackWatch } from "@/domains/agents/evidence-pack-watch";

/** Long enough to spend the whole budget, whatever it is set to. */
const FOREVER = 10 * 60 * 1000;

function tick(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("watching a package that is still being assembled", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("says nothing at all when nothing is in flight", () => {
    const { container } = render(<EvidencePackWatch watching={[]} />);

    tick(FOREVER);

    expect(container.textContent).toBe("");
    // A finished list must not poll. Nothing is going to change.
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("asks the server again while work is in flight", () => {
    render(<EvidencePackWatch watching={["a"]} />);

    tick(15_000);

    // Server-rendered from the registry, so re-rendering on the server is what
    // keeps one read path — no second, unvalidated copy of the boundary.
    expect(refreshMock).toHaveBeenCalledTimes(3);
    expect(screen.getByText(/checking for you/i)).not.toBeNull();
  });

  it("stops after a bounded number of tries and says so", () => {
    render(<EvidencePackWatch watching={["a"]} />);

    tick(FOREVER);
    const tries = refreshMock.mock.calls.length;

    expect(tries).toBeGreaterThan(0);
    expect(screen.getByText(/stopped checking/i)).not.toBeNull();

    // A tab left open for a day must not poll a tenant API for a day.
    tick(FOREVER);
    expect(refreshMock).toHaveBeenCalledTimes(tries);
  });

  it("gives a later package its own budget rather than the last one's", () => {
    const { rerender } = render(<EvidencePackWatch watching={["a"]} />);
    tick(FOREVER);
    expect(screen.getByText(/stopped checking/i)).not.toBeNull();
    refreshMock.mockClear();

    // A different package is different work. Inheriting the spent budget would
    // tell a reader the page had given up on something it had not begun.
    rerender(<EvidencePackWatch watching={["b"]} />);

    expect(screen.getByText(/checking for you/i)).not.toBeNull();
    tick(10_000);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("stops the moment the work lands", () => {
    const { rerender } = render(<EvidencePackWatch watching={["a"]} />);
    tick(10_000);
    refreshMock.mockClear();

    rerender(<EvidencePackWatch watching={[]} />);
    tick(FOREVER);

    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("announces progress politely rather than interrupting", () => {
    // Assertive would interrupt a screen reader every five seconds to say
    // nothing has changed yet.
    render(<EvidencePackWatch watching={["a"]} />);

    expect(
      screen.getByText(/checking for you/i).getAttribute("aria-live"),
    ).toBe("polite");
  });
});
