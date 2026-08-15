/**
 * Primitives for figures that are drawn as a function of time rather than
 * animated as a sequence of transitions.
 *
 * Every figure exposes `render(t, root)` and is called once a frame with its
 * position in the cycle. Nothing accumulates state, so a figure cannot drift
 * out of sync, pausing is just not calling it, and the loop is a modulo rather
 * than a chain of resets.
 */

/**
 * The reference composition drives every figure with `(elapsed * 0.6) % cycle`,
 * so its clock runs at 0.6× wall time and each beat it names lasts 1/0.6 as
 * long in real seconds. Reading those numbers as seconds makes every figure
 * run 1.67× too fast, which is exactly what it looks like.
 *
 * `beat()` converts, so timings below can stay written in the reference's own
 * units and be checked against it directly.
 */
export const REFERENCE_SPEED = 0.6;

/** Converts a reference beat into real seconds. */
export function beat(units: number): number {
  return units / REFERENCE_SPEED;
}

/** A linear ramp from 0 at `from` to 1 at `to`, clamped at both ends. */
export function ramp(t: number, from: number, to: number): number {
  return Math.max(0, Math.min(1, (t - from) / (to - from)));
}

/** easeInOutQuad, for things that move through space. */
export function ease(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

/**
 * Reveals an element by wiping it in from the left.
 *
 * Opacity is deliberately binary: the element is either there or it is not,
 * and the clip does all the visible work. A wipe reads as something being
 * printed; a fade reads as generic interface chrome.
 */
export function wipe(el: Element, p: number): void {
  const style = (el as HTMLElement).style;
  style.opacity = p > 0 ? "1" : "0";
  style.clipPath =
    p >= 1 ? "none" : `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
}

/** Sets opacity without a transition — for states that snap rather than fade. */
export function show(el: Element, visible: boolean, alpha = 1): void {
  (el as HTMLElement).style.opacity = visible ? String(alpha) : "0";
}
