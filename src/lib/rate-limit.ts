/**
 * Fixed-window request counters held in process memory.
 *
 * Deliberately not a shared store. This repo has no datastore, and standing
 * one up for a contact form is more operational surface than the form is
 * worth. The consequence is real and worth stating plainly: budgets are
 * per-instance and reset on deploy, so this bounds a single script hammering
 * one origin, not a distributed campaign. Put a shared counter behind it
 * before running more than one instance.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/**
 * Callers are keyed on a client-supplied header, so the map is bounded rather
 * than trusted: past this many live keys, expired windows are swept before a
 * new one is opened. Without it, rotating the header is itself a slow leak.
 */
const SWEEP_AT = 10_000;

/**
 * Records one hit against `key` and reports whether it went over `limit`.
 *
 * The window is fixed, not sliding: it opens on the first hit and every hit
 * inside it counts, so a caller that stops for one window starts clean.
 */
export function overLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  if (windows.size >= SWEEP_AT) {
    for (const [held, window] of windows) {
      if (now >= window.resetAt) windows.delete(held);
    }
  }

  const open = windows.get(key);
  if (!open || now >= open.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  open.count += 1;
  return open.count > limit;
}

/** Counters outlive a single call by design, so tests need a way to clear. */
export function resetRateLimits(): void {
  windows.clear();
}
