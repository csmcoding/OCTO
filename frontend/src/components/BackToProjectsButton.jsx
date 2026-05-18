import { useState } from 'react'

export default function BackToProjectsButton({ onReset, visible }) {
  const [hovered, setHovered] = useState(false)
  if (!visible) return null

  return (
    <button
      style={{
        position: 'fixed',
        top: 14,
        right: 20,
        background: 'rgba(6, 6, 16, 0.9)',
        border: `1px solid ${hovered ? 'rgba(124,157,245,0.45)' : 'rgba(124,157,245,0.2)'}`,
        borderRadius: 20,
        padding: '5px 13px',
        color: hovered ? '#a8bffa' : '#7c9df5',
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 11,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        zIndex: 200,
        boxShadow: hovered ? '0 0 14px rgba(124,157,245,0.12)' : 'none',
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
