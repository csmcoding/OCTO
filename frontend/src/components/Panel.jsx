import { useState } from 'react'
import { openNode } from '../utils/loadTree'
import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'
import { getNodeColor } from '../utils/palette'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"

const ACTIONS = [
  { action: 'editor',   label: 'Open in Cursor',  foldersOnly: false },
  { action: 'files',    label: 'Open in Dolphin', foldersOnly: true  },
  { action: 'terminal', label: 'Open in Konsole', foldersOnly: true  },
]

function statusLabel(status, defaultLabel) {
  if (!status || status === 'idle') return { text: defaultLabel, color: '#7c9df5' }
  if (status === 'opening') return { text: 'opening...', color: '#6e6e9e' }
  if (status === 'ok')      return { text: '✓ opened',   color: '#3dffa0' }
  return                           { text: '✗ failed',   color: '#ff4466' }
}

export default function Panel({ node, onClose }) {
  const [openStatus, setOpenStatus] = useState({})
  const [hoverBtn, setHoverBtn] = useState(null)

  const nodeColor = getNodeColor(node)

  const displayPath = node.path.length > 55
    ? '...' + node.path.slice(-55)
    : node.path

  const activeSignals = getActiveSignals(node)

  const handleOpen = async (action) => {
    setOpenStatus(prev => ({ ...prev, [action]: 'opening' }))
    try {
      const result = await openNode(node.path, action)
      if (result.ok) {
        setOpenStatus(prev => ({ ...prev, [action]: 'ok' }))
        setTimeout(() => setOpenStatus(prev => ({ ...prev, [action]: 'idle' })), 2000)
      } else {
        throw new Error(result.error ?? 'failed')
      }
    } catch (err) {
      console.error('open failed:', err)
      setOpenStatus(prev => ({ ...prev, [action]: 'error' }))
      setTimeout(() => setOpenStatus(prev => ({ ...prev, [action]: 'idle' })), 3000)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 52,
      left: 20,
      width: 256,
      background: 'rgba(6, 6, 16, 0.95)',
      border: '1px solid rgba(124,157,245,0.18)',
      borderLeft: `2px solid ${nodeColor}`,
      borderRadius: 10,
      backdropFilter: 'blur(16px)',
      boxShadow: `0 0 0 1px rgba(124,157,245,0.05), 0 12px 40px rgba(0,0,0,0.75), 0 0 20px ${nodeColor}18`,
      padding: '16px 18px 16px 16px',
      fontFamily: MONO,
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 10,
          right: 12,
          background: 'none',
          border: 'none',
          color: '#3a3a5e',
          fontSize: 15,
          cursor: 'pointer',
          padding: '0 2px',
          lineHeight: 1,
          fontFamily: MONO,
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.target.style.color = '#e2e2f2'}
        onMouseLeave={e => e.target.style.color = '#3a3a5e'}
      >
        ×
      </button>

      <div style={{ fontSize: 13, fontWeight: 600, color: nodeColor, letterSpacing: '0.02em', marginBottom: 3, paddingRight: 20 }}>
        {node.name}
      </div>
      <div style={{ fontSize: 9, color: '#3a3a5e', marginBottom: 11, wordBreak: 'break-all' }}>
        {displayPath}
      </div>

      <div style={{ height: 1, background: `${nodeColor}20`, margin: '0 0 10px' }} />

      <div style={{ marginBottom: 11 }}>
        {activeSignals.length === 0 ? (
          <span style={{ fontSize: 11, color: '#3dffa0' }}>✓ Clean</span>
        ) : (
          activeSignals.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7,
                borderRadius: '50%', background: SIGNAL_COLORS[key], flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: SIGNAL_COLORS[key] }}>
                {SIGNAL_LABELS[key]}
              </span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ACTIONS
          .filter(({ foldersOnly }) => !foldersOnly || node.type === 'folder')
          .map(({ action, label }) => {
            const st = statusLabel(openStatus[action], label)
            const isHov = hoverBtn === action
            return (
              <button
                key={action}
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  padding: '4px 9px',
                  borderRadius: 4,
                  background: isHov ? 'rgba(124,157,245,0.14)' : 'rgba(124,157,245,0.06)',
                  border: `1px solid ${isHov ? 'rgba(124,157,245,0.4)' : 'rgba(124,157,245,0.18)'}`,
                  color: isHov ? '#e2e2f2' : st.color,
                  letterSpacing: '0.03em',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onClick={() => handleOpen(action)}
                onMouseEnter={() => setHoverBtn(action)}
                onMouseLeave={() => setHoverBtn(null)}
              >
                {st.text}
              </button>
            )
          })}
      </div>
    </div>
  )
}
