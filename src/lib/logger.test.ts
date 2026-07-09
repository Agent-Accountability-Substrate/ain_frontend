// The logger must never receive secrets, key material, or PII in its
// fields; these tests only exercise the emission format.
import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

const levels = ["debug", "info", "warn", "error"] as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it.each(levels)(
    "%s emits one JSON line with timestamp, level and event",
    (level) => {
      const spy = vi.spyOn(console, level).mockImplementation(() => undefined);

      logger[level]("registry.started");

      expect(spy).toHaveBeenCalledTimes(1);
      const line = spy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(line) as Record<string, unknown>;
      expect(parsed["level"]).toBe(level);
      expect(parsed["event"]).toBe("registry.started");
      expect(new Date(parsed["timestamp"] as string).toISOString()).toBe(
        parsed["timestamp"],
      );
    },
  );

  it("merges structured fields into the emitted object", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logger.info("resolver.lookup", { ain: "did:ain:example", durationMs: 12 });

    const line = spy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed["ain"]).toBe("did:ain:example");
    expect(parsed["durationMs"]).toBe(12);
    expect(parsed["event"]).toBe("resolver.lookup");
  });

  it("emits valid JSON when no fields are given", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    logger.warn("registry.degraded");

    const line = spy.mock.calls[0]?.[0] as string;
    expect(() => JSON.parse(line)).not.toThrow();
  });
});
