import { clamp } from './clamp'

/**
 * Range Mapping Utility (Step 5 - Motion Mathematics)
 *
 * Proportionally translates an input value from an input range [inMin, inMax]
 * into an output target range [outMin, outMax].
 *
 * Example:
 * progress 0.25 -> 0.85 maps smoothly to camera scale 1.00 -> 1.12
 *
 * @param value The input numerical value
 * @param inMin Lower boundary of input domain
 * @param inMax Upper boundary of input domain
 * @param outMin Lower boundary of target range
 * @param outMax Upper boundary of target range
 * @param clampResult Whether to clamp the output to [outMin, outMax] (default: true)
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampResult: boolean = true
): number {
  if (inMax - inMin === 0) return outMin
  const normalized = (value - inMin) / (inMax - inMin)
  const result = outMin + normalized * (outMax - outMin)

  if (!clampResult) return result

  const min = Math.min(outMin, outMax)
  const max = Math.max(outMin, outMax)
  return clamp(result, min, max)
}
