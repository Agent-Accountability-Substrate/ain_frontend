import { describe, expect, it } from "vitest";

import { PASSPORT_VERSIONS } from "@/domains/marketing/landing-content";

describe("PASSPORT_VERSIONS", () => {
  it("shows the same scope on the card and on its record", () => {
    for (const version of PASSPORT_VERSIONS) {
      const row = version.record.find((entry) => entry.label === "Scope");

      // The section's whole claim is that the signed record is what settles a
      // dispute, so a record disagreeing with the face of the card undoes it.
      expect(row?.value).toEqual(version.scope);
    }
  });

  it("names the same accountable role on both faces", () => {
    for (const version of PASSPORT_VERSIONS) {
      const row = version.record.find((entry) => entry.label === "Accountable");
      expect(row?.value).toBe(version.accountable);
    }
  });

  it("keeps one identifier across every version", () => {
    // The point the deck exists to make: scope and accountability move, the
    // identifier does not.
    expect(new Set(PASSPORT_VERSIONS.map((v) => v.ain)).size).toBe(1);
    const ains = PASSPORT_VERSIONS.map(
      (v) => v.record.find((e) => e.label === "Permanent AIN")?.value,
    );
    expect(new Set(ains).size).toBe(1);
  });

  it("marks exactly one version as in force, and it is the last", () => {
    const live = PASSPORT_VERSIONS.filter((v) => v.inForce);
    expect(live).toHaveLength(1);
    expect(live[0]?.id).toBe(PASSPORT_VERSIONS.at(-1)?.id);
  });

  it("accents the version in force and the role answering for it, and only there", () => {
    for (const version of PASSPORT_VERSIONS) {
      const accented = version.record
        .filter((entry) => entry.tone === "in-force")
        .map((entry) => entry.label);

      // The section's argument is that the accountable role moved at v3, so
      // the live card says which version is current and who answers for it.
      // A superseded card colouring the same two rows would flatten that.
      expect(accented).toEqual(
        version.inForce ? ["Document version", "Accountable"] : [],
      );
    }
  });

  it("states each version's own document version on its record", () => {
    for (const version of PASSPORT_VERSIONS) {
      const row = version.record.find(
        (entry) => entry.label === "Document version",
      );
      expect(row?.value).toBe(version.id);
    }
  });
});
