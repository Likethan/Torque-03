/**
 * Frame Mathematics & Timeline Utilities
 *
 * Core calculations for the scroll-scrubbed cinematic pipeline:
 * SCROLL POSITION → NORMALIZED PROGRESS (0..1) → FRAME INDEX (0..totalFrames-1)
 */

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Maps normalized scroll progress (0.0 to 1.0) to an integer frame index.
 * Example: progress 0.42 with 100 total frames -> frameIndex 42
 */
export function progressToFrameIndex(progress: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0
  const raw = Math.round(progress * (totalFrames - 1))
  return clamp(raw, 0, totalFrames - 1)
}

/**
 * Maps a frame index back to its normalized timeline progress (0.0 to 1.0).
 */
export function frameIndexToProgress(frameIndex: number, totalFrames: number): number {
  if (totalFrames <= 1) return 0
  return clamp(frameIndex / (totalFrames - 1), 0, 1)
}

/**
 * Formats frame index for editorial display: "FRAME 042 / 100"
 */
export function formatFrameNumber(frameIndex: number, totalFrames: number = 100): string {
  const current = String(frameIndex).padStart(3, '0')
  const total = String(totalFrames).padStart(3, '0')
  return `FRAME ${current} / ${total}`
}

/**
 * Formats frame count into standard 24fps cinematic timecode: "00:00:01:18"
 */
export function formatTimecode(frameIndex: number, fps: number = 24): string {
  const totalSeconds = Math.floor(frameIndex / fps)
  const frames = frameIndex % fps
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`
}

/**
 * Calculates normalized scroll progress of a pinned container relative to the viewport.
 * When top of container meets top of viewport: progress = 0.
 * When bottom of container meets bottom of viewport: progress = 1.
 */
export function calculateNormalizedProgress(
  containerTop: number,
  containerHeight: number,
  windowHeight: number
): number {
  const totalScrollable = containerHeight - windowHeight
  if (totalScrollable <= 0) return 0
  const scrolled = -containerTop
  return clamp(scrolled / totalScrollable, 0, 1)
}
