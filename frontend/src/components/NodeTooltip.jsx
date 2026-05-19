import { getDominantColor, getActiveSignals, SIGNAL_LABELS } from '../utils/signals'
import { getNodeColor } from '../utils/palette'

// Kept for existing tests — pure function, no side effects
export function getTooltipLines(node) {
  if (!node) return null
  const dominantSignal = node.dominantSignal ?? null
  const ext = node.type === 'file'
    ? (node.name.includes('.') ? '.' + node.name.split('.').pop() : 'file')
    : 'folder'
  return {
    name: node.name,
    signalLabel: dominantSignal ? (SIGNAL_LABELS[dominantSignal] ?? null) : null,
    signalColor: dominantSignal ? getDominantColor(node) : null,
    typeLabel: ext,
  }
}

const ACT_COLORS = { hot: '#ff6b35', warm: '#d4a828', cool: '#2eb8c0', stale: '#555570' }
const ACT_LABELS = { hot: 'active today', warm: 'active this week', cool: 'active this month', stale: 'quiet' }

export default function NodeTooltip({ node, x, y, activityLevel = null }) {
  if (!node) return null

  const nodeColor = getNodeColor(node)
  const activeSignals = getActiveSignals(node)
  const isFolder = node.type === 'folder'
  const childCount = node.children?.length ?? 0

  const left = Math.min(x + 14, window.innerWidth - 228)
  const top = Math.max(y - 8, 8)

  return (
    <div style={{
      position: 'fixed',
      left,
      top,
      zIndex: 300,
      background: 'rgba(6,6,18,0.95)',
      border: `1px solid ${nodeColor}44`,
      borderLeft: `2px solid ${nodeColor}`,
      borderRadius: 8,
      backdropFilter: 'blur(16px)',
      padding: '8px 12px',
      pointerEvents: 'none',
      animation: 'fadeIn 0.12s ease',
      maxWidth: 210,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: (activityLevel || activeSignals.length > 0 || (isFolder && childCount > 0)) ? 5 : 0,
      }}>
        <span style={{ fontSize: 11, opacity: 0.55 }}>
          {isFolder ? '⬡' : '◈'}
        </span>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12, fontWeight: 600,
          color: nodeColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 160,
        }}>{node.name}</span>
      </div>

      {activityLevel && ACT_LABELS[activityLevel] && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.04em',
          color: ACT_COLORS[activityLevel] ?? 'rgba(200,200,230,0.55)',
          marginBottom: activeSignals.length > 0 ? 3 : 0,
        }}>
          ◎ {ACT_LABELS[activityLevel]}
        </div>
      )}

      {activeSignals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeSignals.slice(0, 3).map(key => (
            <span key={key} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, color: 'rgba(200,200,230,0.55)',
              letterSpacing: '0.04em',
            }}>
              · {SIGNAL_LABELS?.[key] ?? key}
            </span>
          ))}
        </div>
      )}

      {isFolder && childCount > 0 && (
        <div style={{
          marginTop: activeSignals.length > 0 ? 4 : 0,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'rgba(110,110,158,0.6)',
        }}>
          {childCount} items
        </div>
      )}
      {isFolder && node.hasChildren && childCount === 0 && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: 'rgba(110,110,158,0.45)',
        }}>
          not loaded
        </div>
      )}
    </div>
  )
}
