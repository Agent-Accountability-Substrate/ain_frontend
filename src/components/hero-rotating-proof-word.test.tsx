import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HeroRotatingProofWord } from "@/components/hero-rotating-proof-word";

function installMotionPreference(initiallyReduced = false) {
  let changeListener: (() => void) | undefined;
  const preference = {
    matches: initiallyReduced,
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      changeListener = listener;
    }),
    removeEventListener: vi.fn(),
  };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => preference),
  });

  return {
    preference,
    setReducedMotion(matches: boolean) {
      preference.matches = matches;
      act(() => changeListener?.());
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HeroRotatingProofWord", () => {
  it("types and deletes proof words when motion is allowed", () => {
    vi.useFakeTimers();
    const motion = installMotionPreference();
    const { unmount } = render(<HeroRotatingProofWord />);
    const word = screen.getByTestId("hero-proof-word");

    expect(word.textContent).toBe("accountable.");

    act(() => vi.advanceTimersByTime(3_500));
    expect(word.textContent).not.toBe("accountable.");

    motion.setReducedMotion(true);
    expect(word.textContent).toBe("accountable.");
    expect(vi.getTimerCount()).toBe(0);

    motion.setReducedMotion(false);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(motion.preference.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stays static when reduced motion is requested", () => {
    vi.useFakeTimers();
    installMotionPreference(true);
    render(<HeroRotatingProofWord />);

    act(() => vi.advanceTimersByTime(10_000));

    expect(screen.getByTestId("hero-proof-word").textContent).toBe(
      "accountable.",
    );
    expect(vi.getTimerCount()).toBe(0);
  });
});
