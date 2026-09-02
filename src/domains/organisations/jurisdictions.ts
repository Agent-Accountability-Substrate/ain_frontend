/**
 * Jurisdictions offered, and the codes the registry wants.
 *
 * The organisation form collects a display name; the registry takes ISO 3166-1
 * alpha-2 lowercase. Keeping the pairing here puts what we actually support in
 * one place — a jurisdiction whose company register we cannot check should not
 * be selectable.
 *
 * In its own module rather than beside the action that validates against it,
 * because that module is `"use server"` and such a module may export **only**
 * async functions. A const exported from there is stripped from the client
 * bundle and arrives as `undefined` in the browser — and tests that mock the
 * action module never cross that boundary, so they will not catch it.
 */
export const JURISDICTIONS = [{ code: "gb", label: "United Kingdom" }] as const;

export const JURISDICTION_CODES = JURISDICTIONS.map((entry) => entry.code);
