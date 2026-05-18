import { getDominantColor, SIGNAL_LABELS } from '../utils/signals'

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

export default function NodeTooltip({ node, position }) {
  const lines = getTooltipLines(node)
  if (!lines) return null

  return (
    <div style={{
      position: 'fixed',
      left: position.x + 14,
      top: position.y - 10,
      background: 'rgba(6, 6, 16, 0.94)',
      border: '1px solid rgba(124,157,245,0.3)',
      borderRadius: 6,
      padding: '6px 10px',
      pointerEvents: 'none',
      zIndex: 300,
    }}>
      <div style={{ color: '#e2e2f2', fontSize: 13, fontFamily: 'monospace', fontWeight: 500 }}>
        {lines.name}
      </div>
      {lines.signalLabel && (
        <div style={{ color: lines.signalColor, fontSize: 11, fontFamily: 'monospace' }}>
          {lines.signalLabel}
        </div>
      )}
      <div style={{ color: '#6e6e9e', fontSize: 10, fontFamily: 'monospace' }}>
        {lines.typeLabel}
      </div>
    </div>
  )
}
