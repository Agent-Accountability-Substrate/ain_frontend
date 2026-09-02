import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { config } from "@/proxy";

describe("proxy matcher", () => {
  it("keeps public media outside the authentication gate", () => {
    const matcher = new RegExp(`^${config.matcher[0] ?? ""}$`);

    expect(matcher.test("/o")).toBe(true);
    expect(matcher.test("/media/subra-logo.png")).toBe(false);
  });
});
