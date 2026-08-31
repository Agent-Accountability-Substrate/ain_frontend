import { describe, expect, it } from "vitest";

import {
  availableTransitions,
  chainIsContiguous,
  type AgentLifecycleEvent,
} from "@/domains/agents/agent-record";

const link = (
  seq: number,
  eventHash: string,
  previousEventHash: string | null,
): AgentLifecycleEvent => ({
  seq,
  eventType: "registered",
  occurredAt: "2026-07-16T12:00:00Z",
  eventHash,
  previousEventHash,
});

describe("availableTransitions", () => {
  it("offers both withdrawals on an active agent", () => {
    expect(availableTransitions("active")).toEqual(["suspend", "revoke"]);
  });

  it("cannot suspend an agent that is already suspended", () => {
    // The lifecycle ledger has no reinstatement event, so there is no way back
    // — and suspending twice is not a transition the registry models.
    expect(availableTransitions("suspended")).toEqual(["revoke"]);
  });

  it("offers nothing once an agent is revoked", () => {
    // Terminal. Nothing follows a revocation.
    expect(availableTransitions("revoked")).toEqual([]);
  });

  it("offers nothing on a draft, which has no chain to append to", () => {
    expect(availableTransitions("draft")).toEqual([]);
  });

  it("offers nothing for a status this release does not model", () => {
    // Fail closed: an unknown status must not imply an available act.
    expect(availableTransitions("transferred")).toEqual([]);
  });
});

describe("chainIsContiguous", () => {
  it("accepts a chain that links from genesis", () => {
    expect(chainIsContiguous([link(1, "aa", null), link(2, "bb", "aa")])).toBe(
      true,
    );
  });

  it("accepts an empty chain, which is what a draft has", () => {
    expect(chainIsContiguous([])).toBe(true);
  });

  it("rejects a genesis entry that claims a predecessor", () => {
    expect(chainIsContiguous([link(1, "aa", "zz")])).toBe(false);
  });

  it("rejects an entry naming the wrong predecessor", () => {
    // A silent mid-ledger edit is exactly what the chain exists to reveal.
    expect(chainIsContiguous([link(1, "aa", null), link(2, "bb", "cc")])).toBe(
      false,
    );
  });

  it("rejects a gap in the sequence", () => {
    // A dropped entry still links by hash if the ledger is rewritten around
    // it, so the sequence is checked as well as the linkage.
    expect(chainIsContiguous([link(1, "aa", null), link(3, "bb", "aa")])).toBe(
      false,
    );
  });
});
