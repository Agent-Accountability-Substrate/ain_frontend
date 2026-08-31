import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CookieNotice, resetCookieNotice } from "@/lib/cookie-notice";

const KEY = "subra.cookie-notice.v1";

describe("CookieNotice", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Module state, so it outlives a test unless cleared.
    resetCookieNotice();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tells a first-time visitor what the site stores", () => {
    render(<CookieNotice />);

    const notice = screen.getByRole("region", { name: "Cookie notice" });
    expect(notice.textContent).toContain("No analytics or advertising cookies");
    expect(
      screen.getByRole("link", { name: "Read the cookie policy" }),
    ).toHaveProperty("href", expect.stringContaining("/cookies"));
  });

  it("stays dismissed once dismissed", () => {
    const { unmount } = render(<CookieNotice />);

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("region", { name: "Cookie notice" })).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBe("dismissed");

    unmount();
    render(<CookieNotice />);
    expect(screen.queryByRole("region", { name: "Cookie notice" })).toBeNull();
  });

  it("renders when the stored value is not a dismissal", () => {
    window.localStorage.setItem(KEY, "something-else");
    render(<CookieNotice />);

    expect(screen.getByRole("region", { name: "Cookie notice" })).toBeDefined();
  });

  it("shows rather than breaks when storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    // Private mode and blocked site data both throw on access. Showing the
    // notice twice is a smaller failure than the page not rendering.
    render(<CookieNotice />);
    expect(screen.getByRole("region", { name: "Cookie notice" })).toBeDefined();
  });

  it("dismisses for this view even when storage cannot be written", () => {
    // Otherwise "Got it" reads the flag straight back out of the storage that
    // just refused the write, and the notice never goes away.
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<CookieNotice />);

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("region", { name: "Cookie notice" })).toBeNull();
  });
});
