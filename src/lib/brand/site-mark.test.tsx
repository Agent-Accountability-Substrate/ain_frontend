import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteWordmark } from "@/lib/brand/site-mark";

describe("SiteWordmark", () => {
  it("renders the approved local Subra logo", () => {
    const { container } = render(<SiteWordmark />);

    const logo = screen.getByRole("img", { name: "Subra" });
    expect(logo.getAttribute("src")).toContain("subra-logo.png");
    expect(container.querySelector("svg")).toBeNull();
  });

  it("names the product beside the wordmark, and can drop it", () => {
    const { rerender, container } = render(<SiteWordmark />);
    expect(screen.getByText("AIN Registry")).toBeDefined();

    rerender(<SiteWordmark showProduct={false} />);
    screen.getByRole("img", { name: "Subra" });
    expect(container.textContent).toBe("");
  });

  it("hands the caller one handle on both halves of the product name", () => {
    render(<SiteWordmark productClassName="max-[700px]:hidden" />);

    // A surface that drops the name by viewport has to drop the divider with
    // it — the nav's burger is what the divider would otherwise crowd.
    const group = screen.getByText("AIN Registry").parentElement;
    expect(group?.className).toContain("max-[700px]:hidden");
    expect(group?.querySelectorAll("span")).toHaveLength(2);
  });

  it("retains the reversible compact mark for dark surfaces", () => {
    const { container } = render(<SiteWordmark variant="inverse" />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(container.textContent).toContain("Subra");
    expect(container.innerHTML).toContain("#F0803C");
  });

  it("renders the approved wordmark in high-contrast white", () => {
    const { container } = render(
      <SiteWordmark variant="white" showProduct={false} />,
    );

    const logo = screen.getByRole("img", { name: "Subra" });
    expect(logo.getAttribute("src")).toContain("subra-logo.png");
    expect(logo.className).toContain("brightness-0");
    expect(logo.className).toContain("invert");
    expect(container.textContent).toBe("");
  });
});
