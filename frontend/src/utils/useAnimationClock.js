import { useState, useRef, useEffect } from 'react'

/**
 * Animates from 0 → 1 over `duration` ms using ease-out-cubic.
 * Restarts the animation whenever `revealKey` changes.
 * Progress stays at 1 after animation completes (no reset).
 * Instantly jumps to 1 when prefers-reduced-motion is set.
 */
export function useRevealProgress(revealKey, duration = 1200) {
  const [progress, setProgress] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }

    startRef.current = null
    setProgress(0)

    const tick = (now) => {
      if (!startRef.current) startRef.current = now
      const p = Math.min((now - startRef.current) / duration, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [revealKey, duration])

  return progress
}
