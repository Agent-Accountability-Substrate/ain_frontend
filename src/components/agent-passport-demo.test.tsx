import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AgentPassportDemo } from "@/components/agent-passport-demo";

describe("AgentPassportDemo", () => {
  it("renders the complete illustrative record", () => {
    render(<AgentPassportDemo />);

    expect(
      screen.getByRole("heading", {
        name: "Agent accountability passport",
      }),
    ).toBeDefined();
    expect(screen.getByText("Illustrative demo data")).toBeDefined();
    expect(screen.getByText("Payments Operations Agent")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Copy permanent AIN" }),
    ).toBeDefined();
    expect(
      screen.getByRole("list", { name: "Agent scope" }),
    ).toBeDefined();
    expect(screen.getByText("Sequence 43")).toBeDefined();
  });
});
