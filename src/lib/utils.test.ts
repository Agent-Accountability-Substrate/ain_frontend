import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("drops falsy and conditional values", () => {
    const isHidden = false;
    expect(cn("flex", isHidden && "hidden", undefined, null)).toBe("flex");
  });

  it("supports object and array inputs", () => {
    expect(cn(["flex", { hidden: false, "items-center": true }])).toBe(
      "flex items-center",
    );
  });

  it("dedupes conflicting tailwind utilities, keeping the last one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("keeps non-conflicting tailwind utilities intact", () => {
    expect(cn("px-2", "py-4")).toBe("px-2 py-4");
  });
});
