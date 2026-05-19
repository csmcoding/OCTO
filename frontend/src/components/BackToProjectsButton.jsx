import { useState } from 'react'

export default function BackToProjectsButton({ onReset, visible, colorTheme = 'dark' }) {
  const [hovered, setHovered] = useState(false)
  if (!visible) return null
  const isLight = colorTheme === 'light'

  return (
    <button
      style={{
        position: 'fixed',
        top: 14,
        right: 20,
        background: isLight
          ? (hovered ? 'rgba(0,96,128,0.08)' : 'rgba(235,242,252,0.88)')
          : (hovered ? 'rgba(124,157,245,0.08)' : 'rgba(6,6,16,0.9)'),
        border: `1px solid ${hovered
          ? (isLight ? 'rgba(0,96,128,0.55)' : 'rgba(124,157,245,0.45)')
          : (isLight ? 'rgba(0,96,128,0.22)' : 'rgba(124,157,245,0.2)')}`,
        borderRadius: 20,
        padding: '5px 13px',
        color: hovered
          ? (isLight ? '#006080' : '#a8bffa')
          : (isLight ? 'rgba(30,60,100,0.65)' : '#7c9df5'),
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        boxShadow: hovered ? (isLight ? '0 0 14px rgba(0,96,128,0.08)' : '0 0 14px rgba(124,157,245,0.12)') : 'none',
        transition: 'all 0.15s ease',
      }}
      onClick={onReset}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ← root
    </button>
  )
}
