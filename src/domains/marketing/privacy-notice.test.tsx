import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrivacyNotice } from "@/domains/marketing/privacy-notice";

describe("PrivacyNotice", () => {
  it("publishes the handling details used by the private-preview form", () => {
    const { container } = render(<PrivacyNotice />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Privacy Notice",
    );
    expect(screen.getByText(/Subra is the controller/)).toBeDefined();
    for (const heading of [
      "What we collect",
      "Why we use it",
      "Who receives it",
      "How long we keep it",
      "Your choices and rights",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeDefined();
    }
    for (const link of screen.getAllByRole("link", {
      name: "partner@subrahq.com",
    })) {
      expect(link.getAttribute("href")).toBe("mailto:partner@subrahq.com");
    }
    expect(container.textContent).not.toContain("—");
  });
});
