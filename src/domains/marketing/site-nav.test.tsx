import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteNav } from "@/domains/marketing/site-nav";

function menu() {
  return document.getElementById("site-mobile-menu");
}

describe("SiteNav", () => {
  it("starts with the mobile panel closed and the trigger saying so", () => {
    render(<SiteNav />);

    expect(screen.getByRole("button", { name: "Open menu" })).toBeDefined();
    expect(menu()?.hasAttribute("hidden")).toBe(true);
  });

  it("opens and closes from the one control, which never changes place", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(menu()?.hasAttribute("hidden")).toBe(false);

    // The trigger is the close control too — a separate close button inside
    // the panel would move the target between the two states.
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(menu()?.hasAttribute("hidden")).toBe(true);
  });

  it("closes on Escape", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.keyDown(window, { key: "Escape" });

    expect(menu()?.hasAttribute("hidden")).toBe(true);
  });

  it("closes when a section link is followed, so the panel is not left over the page", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const withinMenu = menu();
    const link = withinMenu?.querySelector('a[href="#integrity"]');
    fireEvent.click(link as Element);

    expect(menu()?.hasAttribute("hidden")).toBe(true);
  });

  it("locks scroll on both html and body while the panel is up", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    // Locking only body still lets iOS Safari scroll the document behind it.
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
  });

  it("needs no measurement to place the panel", () => {
    render(<SiteNav />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    // The announcement, the bar and the panel are one column, so the panel
    // starts where the bar ends by being the next box down. Writing the bar's
    // height into a custom property put the panel 19px out on its first frame,
    // because the effect that measured it ran after that frame was painted.
    for (const property of ["--site-announce-h", "--site-head-h"]) {
      expect(document.documentElement.style.getPropertyValue(property)).toBe(
        "",
      );
    }
  });

  it("hands focus back to the trigger when the panel closes under it", () => {
    render(<SiteNav />);
    const burger = screen.getByRole("button", { name: "Open menu" });

    fireEvent.click(burger);
    const link = menu()?.querySelector('a[href="#integrity"]');
    (link as HTMLElement).focus();
    fireEvent.click(link as Element);

    // The link it was on is `hidden` now. Without this, focus falls back to
    // the body and the next Tab starts again from the top of the document.
    expect(document.activeElement).toBe(burger);
  });

  it("closes itself if the viewport crosses back over the breakpoint", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    // The listener is registered on window rather than by React, so the state
    // update it causes has to be flushed explicitly.
    act(() => {
      window.innerWidth = 1200;
      window.dispatchEvent(new Event("resize"));
    });

    // A rotation to landscape can widen past 700px with the panel still up.
    expect(menu()?.hasAttribute("hidden")).toBe(true);
  });

  it("offers exactly one way in, and it is the vanity route", () => {
    render(<SiteNav />);

    // Desktop and mobile both point at /signin, which forwards to Auth0. The
    // page has no second sign-in path and never links at Auth.js's own
    // endpoints, which are route handlers the router cannot soft-navigate to.
    // One while the panel is shut — the mobile copy is `hidden`, so it is
    // correctly out of the accessibility tree until the menu is opened.
    expect(
      screen.getByRole("link", { name: "Sign in" }).getAttribute("href"),
    ).toBe("/signin");

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const both = screen.getAllByRole("link", { name: "Sign in" });
    expect(both.length).toBe(2);
    for (const link of both) {
      expect(link.getAttribute("href")).toBe("/signin");
    }
    expect(document.querySelector('a[href*="/api/auth"]')).toBeNull();
    expect(
      screen.queryByRole("link", { name: /Create your account/ }),
    ).toBeNull();
  });

  it("closes when Sign in is followed, like every other control in the panel", () => {
    render(<SiteNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const link = menu()?.querySelector('a[href="/signin"]') as HTMLElement;
    // jsdom cannot navigate, and a real click here would log that it tried.
    link.addEventListener("click", (event) => {
      event.preventDefault();
    });
    link.focus();
    fireEvent.click(link);

    // `/signin` is a route handler, so this is a full page load rather than a
    // soft navigation. A panel left up holds the scroll lock and the focus for
    // the whole round trip, and stays up if the load never lands.
    expect(menu()?.hasAttribute("hidden")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("");
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Open menu" }),
    );
  });

  it("drops the product name at the width the burger appears", () => {
    render(<SiteNav />);

    // The official logo + divider + "AIN REGISTRY" share the row with a 40px
    // burger at 375px. The divider goes with the product name or it is left as
    // a hairline rule beside the burger.
    expect(screen.getByText("AIN Registry").parentElement?.className).toContain(
      "max-[700px]:hidden",
    );
  });

  it("links to each section of the page", () => {
    render(<SiteNav />);

    for (const href of ["#record", "#integrity", "#questions"]) {
      expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
  });
});
