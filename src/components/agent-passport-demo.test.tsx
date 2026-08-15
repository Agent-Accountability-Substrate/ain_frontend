import { render, screen } from "@testing-library/react";
import { describe, it } from "vitest";

import { AgentPassportDemo } from "@/components/agent-passport-demo";

describe("AgentPassportDemo", () => {
  it("renders the complete illustrative record", () => {
    render(<AgentPassportDemo />);

    screen.getByRole("heading", {
      name: "Agent accountability passport",
    });
    screen.getByText("Illustrative demo data");
    screen.getByText("Payments Operations Agent");
    screen.getByRole("button", { name: "Copy permanent AIN" });
    screen.getByRole("list", { name: "Agent scope" });
    screen.getByText("Sequence 43");
  });
});
