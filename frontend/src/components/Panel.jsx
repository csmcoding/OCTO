import { useState } from 'react'
import { openNode } from '../utils/loadTree'
import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'

const btnBase = {
  border: 'none',
  padding: '7px 12px',
  borderRadius: 4,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: 12,
}

export default function Panel({ node, onClose }) {
  const [openStatus, setOpenStatus] = useState(null) // null | { action, status }

  const displayPath = node.path.length > 60
    ? '...' + node.path.slice(-60)
    : node.path

  const activeSignals = getActiveSignals(node)

  const handleOpen = async (action) => {
    setOpenStatus({ action, status: 'opening' })
    try {
      await openNode(node.path, action)
      setOpenStatus({ action, status: 'opened' })
      setTimeout(() => setOpenStatus(null), 2000)
    } catch {
      setOpenStatus({ action, status: 'error' })
      setTimeout(() => setOpenStatus(null), 3000)
    }
  }

  const statusText = (action) => {
    if (!openStatus || openStatus.action !== action) return null
    const map = {
      opening: { text: 'opening...', color: '#888888' },
      opened:  { text: '✓ opened',   color: '#44ff88' },
      error:   { text: '✗ failed',   color: '#ff4444' },
    }
    return map[openStatus.status] ?? null
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      background: 'rgba(10, 10, 30, 0.92)',
      border: '1px solid #4A90D9',
      borderRadius: 8,
      padding: '20px 24px',
      color: '#ffffff',
      minWidth: 280,
      fontFamily: 'monospace',
      zIndex: 100,
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 15 }}>
        {node.type === 'folder' ? '📁 Folder' : '📄 File'}
      </h3>
      <p style={{ margin: '0 0 6px 0', fontSize: 12, wordBreak: 'break-all' }}>
        {displayPath}
      </p>

      <div style={{ marginBottom: 12 }}>
        {activeSignals.length === 0 ? (
          <span style={{ fontSize: 12, color: '#44ff88' }}>✓ Clean</span>
        ) : (
          activeSignals.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: SIGNAL_COLORS[key], flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: SIGNAL_COLORS[key] }}>
                {SIGNAL_LABELS[key]}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          { action: 'editor',   label: 'Open in Cursor' },
          { action: 'files',    label: 'Open in Dolphin' },
          ...(node.type === 'folder' ? [{ action: 'terminal', label: 'Open in Konsole' }] : []),
        ].map(({ action, label }) => {
          const st = statusText(action)
          return (
            <span key={action} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <button
                style={{ ...btnBase, background: '#1a2a3a', color: '#4A90D9', border: '1px solid #2a3a4a' }}
                onClick={() => handleOpen(action)}
              >
                {label}
              </button>
              {st && <span style={{ fontSize: 11, color: st.color }}>{st.text}</span>}
            </span>
          )
        })}
        <button
          style={{ ...btnBase, background: 'transparent', color: '#666', border: '1px solid #333' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
