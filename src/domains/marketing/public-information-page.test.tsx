import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AboutSubra } from "@/domains/marketing/about-subra";
import { CookiePolicy } from "@/domains/marketing/cookie-policy";
import { PrivacyNotice } from "@/domains/marketing/privacy-notice";
import { TermsOfService } from "@/domains/marketing/terms-of-service";

describe("public information pages", () => {
  it.each([
    ["Privacy Notice", PrivacyNotice],
    ["Terms of Service", TermsOfService],
    ["Cookie Policy", CookiePolicy],
    ["About Subra", AboutSubra],
  ])("renders %s as a standalone public page", (title, Page) => {
    const { container } = render(<Page />);

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Subra home" }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("contentinfo")).toBeDefined();
    expect(container.textContent).not.toContain("—");
  });

  it("describes only the cookie behavior implemented by the site", () => {
    render(<CookiePolicy />);

    expect(
      screen.getByText(/do not intentionally use analytics/i),
    ).toBeDefined();
    expect(screen.getByText(/strictly necessary cookies/i)).toBeDefined();
  });
});
