/**
 * Clamping Utility (Step 5 - Motion Mathematics)
 *
 * Restricts an input value within inclusive lower and upper numerical bounds.
 * Prevents animation values (scales, opacities, progress) from exceeding intended ranges.
 *
 * @param val The value to clamp
 * @param min Lower bound
 * @param max Upper bound
 * @returns The clamped value
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}
