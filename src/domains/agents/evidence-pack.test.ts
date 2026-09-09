import { describe, expect, it } from "vitest";

import {
  inFlightIds,
  isInFlight,
  packPeriod,
  periodEnd,
  periodStart,
  utcDay,
  utcMoment,
  type EvidencePack,
} from "@/domains/agents/evidence-pack";

const pack = (over: Partial<EvidencePack> = {}): EvidencePack => ({
  packId: "0b6f1d2c-8a4e-4f19-9c3d-5e7a1b2c4d6f",
  ain: "did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:01BX5ZZKBKACTAV9WEVGEMMVRZ",
  packType: "agent-activity",
  packVersion: "1",
  rangeStart: "2026-07-01T00:00:00Z",
  rangeEnd: "2026-07-31T23:59:59Z",
  status: "completed",
  createdAt: "2026-08-01T06:00:00Z",
  ...over,
});

describe("a period", () => {
  it("covers whole days at both ends", () => {
    expect(periodStart("2026-07-01")).toBe("2026-07-01T00:00:00Z");
    // To its final second, not its first instant: a package asked for "to the
    // 31st" that stopped at 00:00:00 would silently drop a day of receipts.
    expect(periodEnd("2026-07-31")).toBe("2026-07-31T23:59:59Z");
  });

  it("reads in UTC, whatever zone the browser is in", () => {
    // The instant that is still 31 July in UTC and already 1 August east of it.
    // Rendered in a local zone this would move the package by a day, at exactly
    // the month boundary these land on.
    expect(utcDay("2026-07-31T23:59:59Z")).toBe("31 Jul 2026");
    expect(packPeriod(pack())).toBe("1 Jul 2026 to 31 Jul 2026 UTC");
  });

  it("says UTC on a moment rather than leaving it to be assumed", () => {
    expect(utcMoment("2026-08-01T06:00:00Z")).toContain("UTC");
    expect(utcMoment("2026-08-01T06:00:00Z")).toContain("1 Aug 2026");
  });
});

describe("work in flight", () => {
  it("counts both queued and generating, which mean the same to a reader", () => {
    expect(isInFlight(pack({ status: "queued" }))).toBe(true);
    expect(isInFlight(pack({ status: "generating" }))).toBe(true);
    expect(isInFlight(pack({ status: "completed" }))).toBe(false);
    // A failed package is finished. Watching one would poll forever over a row
    // that has already reached its outcome.
    expect(isInFlight(pack({ status: "failed" }))).toBe(false);
  });

  it("names which packages are in flight, not merely that some are", () => {
    expect(
      inFlightIds([
        pack({ packId: "a", status: "completed" }),
        pack({ packId: "b", status: "generating" }),
        pack({ packId: "c", status: "queued" }),
      ]),
    ).toEqual(["b", "c"]);
  });

  it("is empty when everything has landed", () => {
    expect(inFlightIds([pack({ status: "failed" })])).toEqual([]);
  });
});
