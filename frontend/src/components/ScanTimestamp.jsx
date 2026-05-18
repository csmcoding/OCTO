import { useState, useEffect } from 'react'

export function relativeTime(date) {
  if (!date) return 'just now'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

export default function ScanTimestamp({ scannedAt }) {
  const [label, setLabel] = useState(() => relativeTime(scannedAt))

  useEffect(() => {
    setLabel(relativeTime(scannedAt))
    const id = setInterval(() => setLabel(relativeTime(scannedAt)), 30000)
    return () => clearInterval(id)
  }, [scannedAt])

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      color: 'var(--text-faint, #3a3a5e)',
      fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
      fontSize: 10,
      zIndex: 50,
      pointerEvents: 'none',
      letterSpacing: '0.05em',
      userSelect: 'none',
    }}>
      last scan: {label}
    </div>
  )
}
