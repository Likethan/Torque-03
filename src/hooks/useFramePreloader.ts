import { useState, useEffect, useRef, useCallback } from 'react'

interface FramePreloaderOptions {
  /** Array of frame URLs, or a function that returns an image URL for an index */
  frameSources?: string[] | ((index: number) => string)
  totalFrames?: number
  /** Primary fallback image to guarantee immediate rendering */
  fallbackSource?: string
}

interface FramePreloaderResult {
  isLoaded: boolean
  loadedCount: number
  totalCount: number
  loadProgress: number
  getImage: (frameIndex: number) => HTMLImageElement | null
  fallbackImage: HTMLImageElement | null
}

/**
 * useFramePreloader
 *
 * Abstract frame loader and cache for cinematic image sequences.
 * Handles:
 * - Deterministic frame caching
 * - Priority-ordered preloading
 * - Immediate fallback image availability
 * - Error isolation
 */
export function useFramePreloader({
  frameSources,
  totalFrames = 100,
  fallbackSource = '/images/accord-hero.jpg',
}: FramePreloaderOptions = {}): FramePreloaderResult {
  const [loadedCount, setLoadedCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [fallbackReady, setFallbackReady] = useState(false)

  const imageCache = useRef<Map<number, HTMLImageElement>>(new Map())
  const fallbackImgRef = useRef<HTMLImageElement | null>(null)

  // 1. Preload fallback studio image first for zero-delay visual baseline
  useEffect(() => {
    if (!fallbackSource) return

    const img = new Image()
    img.src = fallbackSource
    img.onload = () => {
      fallbackImgRef.current = img
      setFallbackReady(true)
    }
    img.onerror = () => {
      console.warn(`[FramePreloader] Failed to load fallback: ${fallbackSource}`)
      setFallbackReady(true)
    }
  }, [fallbackSource])

  // 2. Preload sequence frames if frameSources are provided
  useEffect(() => {
    if (!frameSources) {
      // If no explicit multi-file sequence is provided, the fallback image serves as the frame plate
      setIsLoaded(fallbackReady)
      return
    }

    let isMounted = true
    let count = 0
    const urls: string[] = []

    for (let i = 0; i < totalFrames; i++) {
      if (typeof frameSources === 'function') {
        urls.push(frameSources(i))
      } else if (Array.isArray(frameSources) && frameSources[i]) {
        urls.push(frameSources[i])
      }
    }

    if (urls.length === 0) {
      setIsLoaded(true)
      return
    }

    urls.forEach((url, idx) => {
      const img = new Image()
      img.src = url
      img.onload = () => {
        if (!isMounted) return
        imageCache.current.set(idx, img)
        count++
        setLoadedCount(count)
        if (count >= urls.length) {
          setIsLoaded(true)
        }
      }
      img.onerror = () => {
        if (!isMounted) return
        count++
        setLoadedCount(count)
        if (count >= urls.length) {
          setIsLoaded(true)
        }
      }
    })

    return () => {
      isMounted = false
    }
  }, [frameSources, totalFrames, fallbackReady])

  const getImage = useCallback(
    (frameIndex: number): HTMLImageElement | null => {
      if (imageCache.current.has(frameIndex)) {
        return imageCache.current.get(frameIndex)!
      }
      return fallbackImgRef.current
    },
    []
  )

  const loadProgress = totalFrames > 0 ? loadedCount / totalFrames : 1

  return {
    isLoaded: isLoaded || fallbackReady,
    loadedCount,
    totalCount: totalFrames,
    loadProgress,
    getImage,
    fallbackImage: fallbackImgRef.current,
  }
}
