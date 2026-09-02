import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "@/domains/marketing/site-footer";

describe("SiteFooter", () => {
  it("provides complete product, company and legal navigation", () => {
    const { container } = render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    const navigation = within(footer).getByRole("navigation", {
      name: "Footer navigation",
    });

    const links = [
      ["Product", "/#top"],
      ["Evidence flow", "/#how-it-works"],
      ["Compatibility", "/#compatibility"],
      ["Integrity", "/#integrity"],
      ["Use cases", "/#use-cases"],
      ["Security", "/#security"],
      ["About", "/about"],
      ["Insights", "/blog"],
      ["Contact", "mailto:partner@subrahq.com"],
      ["Privacy Notice", "/privacy"],
      ["Terms of Service", "/terms"],
      ["Cookie Policy", "/cookies"],
    ] as const;

    for (const [name, href] of links) {
      expect(
        within(navigation).getByRole("link", { name }).getAttribute("href"),
      ).toBe(href);
    }
    expect(container.textContent).not.toContain("—");
    expect(container.textContent).not.toContain("Careers");
  });

  it("states the product and legal boundaries plainly", () => {
    const { container } = render(<SiteFooter />);

    const logo = screen.getByRole("img", { name: "Subra" });
    expect(logo.getAttribute("src")).toContain("subra-logo.png");
    expect(logo.className).toContain("brightness-0");
    expect(container.textContent).not.toContain("AIN Registry");

    expect(
      screen.getByText(
        "Subra is not a certified or regulated financial service.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Subra provides evidence and accountability tooling for AI-agent actions. It is not a certification, regulatory approval, or legal compliance guarantee.",
      ),
    ).toBeDefined();
  });
});
