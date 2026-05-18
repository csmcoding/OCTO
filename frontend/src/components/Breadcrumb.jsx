import { useState } from 'react'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SEP = ' › '

export function buildCrumbList(navStack) {
  if (!navStack || navStack.length <= 1) return []

  const label = (node) => node.type === 'you' ? 'OCTO' : (node.name || node.path)

  if (navStack.length <= 5) {
    return navStack.map((node, index) => ({
      key: node.path || String(index),
      label: label(node),
      index,
      clickable: index < navStack.length - 1,
    }))
  }

  const first = {
    key: navStack[0].path || '0',
    label: label(navStack[0]),
    index: 0,
    clickable: true,
  }
  const ellipsis = { key: '...', label: '...', index: null, clickable: false }
  const last3 = navStack.slice(-3).map((node, i) => {
    const realIndex = navStack.length - 3 + i
    return {
      key: node.path || String(realIndex),
      label: label(node),
      index: realIndex,
      clickable: realIndex < navStack.length - 1,
    }
  })
  return [first, ellipsis, ...last3]
}

export default function Breadcrumb({ navStack, onCrumbClick }) {
  const [hoveredVisualIdx, setHoveredVisualIdx] = useState(null)
  const crumbs = buildCrumbList(navStack)
  if (crumbs.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(8, 8, 24, 0.88)',
      border: '1px solid rgba(74, 144, 217, 0.25)',
      backdropFilter: 'blur(4px)',
      borderRadius: 20,
      padding: '6px 16px',
      fontFamily: MONO,
      fontSize: 12,
      letterSpacing: '0.02em',
      color: '#6666aa',
      zIndex: 200,
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}>
      {crumbs.map((crumb, i) => (
        <span key={crumb.key}>
          {i > 0 && (
            <span style={{ color: '#334455', userSelect: 'none' }}>{SEP}</span>
          )}
          {crumb.clickable ? (
            <span
              style={{
                color: '#4A90D9',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: 3,
                background: hoveredVisualIdx === i ? 'rgba(74,144,217,0.15)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={() => setHoveredVisualIdx(i)}
              onMouseLeave={() => setHoveredVisualIdx(null)}
              onClick={() => onCrumbClick(crumb.index)}
            >
              {crumb.label}
            </span>
          ) : (
            <span style={{
              color: crumb.label === '...' ? '#334455' : '#e0e0f0',
              fontWeight: crumb.label === '...' ? 400 : 600,
              padding: '2px 4px',
            }}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
