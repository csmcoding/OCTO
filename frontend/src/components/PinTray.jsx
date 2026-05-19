import { useState } from 'react'
import { getNodeColor } from '../utils/palette'

const MONO = "'JetBrains Mono', 'Fira Code', monospace"

export default function PinTray({ pins, onJump, onUnpin, colorTheme = 'dark' }) {
  const [hoveredPin, setHoveredPin] = useState(null)

  if (!pins?.length) return null

  const isLight = colorTheme === 'light'
  const trayBg     = isLight ? 'rgba(235,242,252,0.92)' : 'rgba(6,6,18,0.88)'
  const trayBorder = isLight ? 'rgba(0,96,128,0.18)'    : 'rgba(124,157,245,0.14)'
  const trayShadow = isLight ? '0 4px 16px rgba(0,60,100,0.12)' : '0 8px 24px rgba(0,0,0,0.6)'
  const nameIdle   = isLight ? 'rgba(30,60,100,0.65)'   : 'rgba(200,200,230,0.65)'
  const nameHov    = isLight ? '#1a2a3a'                : '#e2e2f2'

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 85,
      display: 'flex',
      gap: 6,
      padding: '6px 10px',
      background: trayBg,
      border: `1px solid ${trayBorder}`,
      borderRadius: 999,
      backdropFilter: 'blur(16px)',
      boxShadow: trayShadow,
      maxWidth: 'calc(100vw - 220px)',
      overflowX: 'auto',
      animation: 'fadeIn 0.2s ease',
    }}>
      {pins.map((node) => {
        const color = getNodeColor(node)
        const isHov = hoveredPin === node.id
        return (
          <div
            key={node.id ?? node.path}
            onMouseEnter={() => setHoveredPin(node.id)}
            onMouseLeave={() => setHoveredPin(null)}
            style={{ position: 'relative', flexShrink: 0 }}
          >
            <button
              onClick={() => onJump(node)}
              title={node.path ?? node.name}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 8px',
                background: isHov ? `${color}18` : 'transparent',
                border: `1px solid ${isHov ? color + '44' : 'transparent'}`,
                borderRadius: 999,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
                maxWidth: 130,
              }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: color, flexShrink: 0,
                boxShadow: isHov ? `0 0 5px ${color}` : 'none',
              }} />
              <span style={{
                fontFamily: MONO, fontSize: 9,
                color: isHov ? nameHov : nameIdle,
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', maxWidth: 90,
                letterSpacing: '0.02em',
              }}>
                {node.name}
              </span>
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onUnpin(node) }}
              aria-label={`Unpin ${node.name}`}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: isHov ? 'rgba(255,107,107,0.9)' : 'rgba(255,107,107,0.3)',
                border: `1px solid ${isHov ? 'rgba(255,80,80,0.8)' : 'rgba(255,107,107,0.35)'}`,
                color: '#fff',
                fontSize: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}
