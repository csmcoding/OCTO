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
      background: 'rgba(8, 8, 20, 0.75)',
      border: '1px solid rgba(124,157,245,0.14)',
      backdropFilter: 'blur(12px)',
      borderRadius: 20,
      padding: '5px 14px',
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: '0.02em',
      color: '#6e6e9e',
      zIndex: 120,
      whiteSpace: 'nowrap',
      userSelect: 'none',
      maxWidth: 'calc(100vw - 320px)',
      overflow: 'hidden',
    }}>
      {crumbs.map((crumb, i) => (
        <span key={crumb.key}>
          {i > 0 && (
            <span style={{ color: 'rgba(110,110,158,0.35)', userSelect: 'none' }}>{SEP}</span>
          )}
          {crumb.clickable ? (
            <span
              style={{
                color: hoveredVisualIdx === i ? '#c8a2ff' : '#7c9df5',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: 3,
                background: hoveredVisualIdx === i ? 'rgba(200,162,255,0.08)' : 'transparent',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={() => setHoveredVisualIdx(i)}
              onMouseLeave={() => setHoveredVisualIdx(null)}
              onClick={() => onCrumbClick(crumb.index)}
            >
              {crumb.label}
            </span>
          ) : (
            <span style={{
              color: crumb.label === '...' ? '#3a3a5e' : '#e2e2f2',
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
