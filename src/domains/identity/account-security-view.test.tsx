import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccountSecurityView } from "@/domains/identity/account-security-view";

vi.mock("@/domains/auth/auth-actions", () => ({
  signOutAction: vi.fn(),
}));

describe("AccountSecurityView", () => {
  it("separates authentication from identity assurance", () => {
    render(
      <AccountSecurityView email="casey@example.com" name="Casey Morgan" />,
    );

    expect(
      screen.getByRole("heading", { name: "Account & Security" }),
    ).toBeDefined();
    expect(screen.getByText("Casey Morgan")).toBeDefined();
    expect(screen.getAllByText("casey@example.com")).toHaveLength(2);
    expect(screen.getByText("Managed by Auth0")).toBeDefined();
    expect(screen.getByText("Not Started")).toBeDefined();
    expect(
      screen.getByText(/never treated as identity assurance/),
    ).toBeDefined();
  });
});
