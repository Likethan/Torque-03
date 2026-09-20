/**
 * ACCESSIBLE TEXT-SPLITTING UTILITY
 * STEP 5 — KINETIC TYPOGRAPHY SYSTEM
 *
 * Provides granular, accessible text splitting (chars, masked-chars, words, masked-words, masked-lines)
 * while preserving full semantic HTML and screen-reader accessibility.
 *
 * Accessibility Pattern:
 * 1. Root element retains its original semantic tag (h1, h2, p, etc.)
 * 2. Root element is annotated with aria-label="<original text content>"
 * 3. Split visual nodes (words, characters, masks) are marked with aria-hidden="true"
 * 4. Screen readers and copy/paste tools read the unified semantic string.
 */

export interface SplitTextOptions {
  type?: 'chars' | 'masked-chars' | 'words' | 'masked-words' | 'masked-lines'
  charClass?: string
  wordClass?: string
  maskClass?: string
  innerClass?: string
  lineClass?: string
}

export interface SplitTextResult {
  root: HTMLElement
  chars: HTMLElement[]
  words: HTMLElement[]
  masks: HTMLElement[]
  lines: HTMLElement[]
  revert: () => void
}

/**
 * Splits an element's text content into accessible, animatable DOM spans.
 *
 * @param element The target HTMLElement to split
 * @param options Configuration for split type and custom classes
 */
export function splitText(
  element: HTMLElement | null,
  options: SplitTextOptions = {}
): SplitTextResult | null {
  if (!element) return null

  const {
    type = 'words',
    charClass = 'split-char',
    wordClass = 'split-word',
    maskClass = 'mask-wrapper',
    innerClass = 'masked-inner',
    lineClass = 'split-line',
  } = options

  // 1. Cache original text and innerHTML for clean reversion
  const originalHTML = element.innerHTML
  const rawText = element.textContent || ''
  const trimmedText = rawText.trim()

  if (!trimmedText) return null

  // 2. Dual-layer accessibility: Preserve semantic text for screen readers
  element.setAttribute('aria-label', trimmedText)

  const chars: HTMLElement[] = []
  const words: HTMLElement[] = []
  const masks: HTMLElement[] = []
  const lines: HTMLElement[] = []

  // Clear current element children to construct split tree
  element.innerHTML = ''

  // Fragment to batch DOM insertions
  const fragment = document.createDocumentFragment()

  if (type === 'masked-lines') {
    // Split by explicit line breaks or sentences
    const lineSegments = trimmedText.split(/\n+/).map(l => l.trim()).filter(Boolean)
    const effectiveLines = lineSegments.length > 0 ? lineSegments : [trimmedText]

    effectiveLines.forEach((lineText) => {
      const lineMask = document.createElement('span')
      lineMask.className = `${maskClass} ${lineClass}-mask`
      lineMask.setAttribute('aria-hidden', 'true')
      lineMask.style.display = 'block'
      lineMask.style.overflow = 'hidden'

      const lineInner = document.createElement('span')
      lineInner.className = `${innerClass} ${lineClass}`
      lineInner.textContent = lineText
      lineInner.style.display = 'block'
      lineInner.style.willChange = 'transform, opacity'

      lineMask.appendChild(lineInner)
      fragment.appendChild(lineMask)

      masks.push(lineMask)
      lines.push(lineInner)
      chars.push(lineInner)
      words.push(lineInner)
    })
  } else {
    // Parse words while preserving spacing
    const wordsArray = trimmedText.split(/\s+/)

    wordsArray.forEach((wordText, wordIndex) => {
      const wordSpan = document.createElement('span')
      wordSpan.className = wordClass
      wordSpan.setAttribute('aria-hidden', 'true')
      wordSpan.style.display = 'inline-block'
      wordSpan.style.whiteSpace = 'nowrap'
      wordSpan.style.verticalAlign = 'bottom'

      if (type === 'chars') {
        // Split characters inside word wrapper to prevent mid-word wrapping
        for (let i = 0; i < wordText.length; i++) {
          const char = wordText[i]
          const charSpan = document.createElement('span')
          charSpan.className = charClass
          charSpan.textContent = char
          charSpan.style.display = 'inline-block'
          charSpan.style.willChange = 'transform, opacity'
          chars.push(charSpan)
          wordSpan.appendChild(charSpan)
        }
      } else if (type === 'masked-chars') {
        // Each character inside its own overflow-hidden mask
        for (let i = 0; i < wordText.length; i++) {
          const char = wordText[i]
          const charMask = document.createElement('span')
          charMask.className = maskClass
          charMask.style.display = 'inline-block'
          charMask.style.overflow = 'hidden'
          charMask.style.verticalAlign = 'bottom'

          const charSpan = document.createElement('span')
          charSpan.className = `${innerClass} ${charClass}`
          charSpan.textContent = char
          charSpan.style.display = 'inline-block'
          charSpan.style.willChange = 'transform, opacity'

          charMask.appendChild(charSpan)
          wordSpan.appendChild(charMask)
          masks.push(charMask)
          chars.push(charSpan)
        }
      } else if (type === 'masked-words') {
        // Mask wrapper with overflow: hidden around word
        const maskSpan = document.createElement('span')
        maskSpan.className = maskClass
        maskSpan.style.display = 'inline-block'
        maskSpan.style.overflow = 'hidden'
        maskSpan.style.verticalAlign = 'bottom'

        const innerSpan = document.createElement('span')
        innerSpan.className = innerClass
        innerSpan.textContent = wordText
        innerSpan.style.display = 'inline-block'
        innerSpan.style.willChange = 'transform, opacity'

        maskSpan.appendChild(innerSpan)
        wordSpan.appendChild(maskSpan)
        masks.push(maskSpan)
        chars.push(innerSpan) // animatable targets
      } else {
        // Standard word-level
        wordSpan.textContent = wordText
        wordSpan.style.willChange = 'transform, opacity'
        chars.push(wordSpan)
      }

      words.push(wordSpan)
      fragment.appendChild(wordSpan)

      // Append space between words except after the last word
      if (wordIndex < wordsArray.length - 1) {
        const spaceNode = document.createTextNode(' ')
        fragment.appendChild(spaceNode)
      }
    })
  }

  element.appendChild(fragment)

  const revert = () => {
    element.innerHTML = originalHTML
    element.removeAttribute('aria-label')
  }

  return {
    root: element,
    chars,
    words,
    masks,
    lines,
    revert,
  }
}
