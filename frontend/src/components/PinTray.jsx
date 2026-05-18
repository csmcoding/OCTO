import { useState } from 'react'
import { getNodeColor } from '../utils/palette'

const MONO = "'JetBrains Mono', 'Fira Code', monospace"

export default function PinTray({ pins, onJump, onUnpin }) {
  const [hoveredPin, setHoveredPin] = useState(null)

  if (!pins?.length) return null

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
      background: 'rgba(6,6,18,0.88)',
      border: '1px solid rgba(124,157,245,0.14)',
      borderRadius: 999,
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
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
                color: isHov ? '#e2e2f2' : 'rgba(200,200,230,0.65)',
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', maxWidth: 90,
                letterSpacing: '0.02em',
              }}>
                {node.name}
              </span>
            </button>

            {isHov && (
              <button
                onClick={(e) => { e.stopPropagation(); onUnpin(node) }}
                style={{
                  position: 'absolute', top: -5, right: -5,
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'rgba(255,107,107,0.8)',
                  border: 'none', color: '#fff',
                  fontSize: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  animation: 'fadeIn 0.1s ease',
                }}
              >×</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
