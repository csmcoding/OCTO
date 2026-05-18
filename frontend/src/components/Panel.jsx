import { useState } from 'react'
import { openNode } from '../utils/loadTree'
import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'
import { getNodeColor } from '../utils/palette'
import { useFilePreview } from '../hooks/useFilePreview'
import { useGitDiff } from '../hooks/useGitDiff'

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

export default function Panel({ node, onClose, isPinned, onPin, onUnpin }) {
  const [openStatus, setOpenStatus] = useState({})
  const [hoverBtn, setHoverBtn] = useState(null)

  const nodeColor = getNodeColor(node)
  const preview = useFilePreview(node)
  const gitDiff = useGitDiff(node)

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
      bottom: 56,
      left: 20,
      width: 268,
      background: 'rgba(8, 8, 22, 0.90)',
      border: '1px solid rgba(124,157,245,0.15)',
      borderTop: `2px solid ${nodeColor}`,
      borderRadius: 12,
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      boxShadow: [
        '0 0 0 1px rgba(124,157,245,0.05)',
        '0 24px 64px rgba(0,0,0,0.85)',
        'inset 0 1px 0 rgba(255,255,255,0.04)',
      ].join(', '),
      padding: '16px 18px',
      fontFamily: MONO,
      zIndex: 100,
      animation: 'fadeIn 0.2s ease',
      maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto',
    }}>
      <button
        onClick={isPinned ? onUnpin : onPin}
        title={isPinned ? 'Unpin' : 'Pin to tray'}
        style={{
          position: 'absolute', top: 14, right: 36,
          background: 'none', border: 'none',
          color: isPinned ? '#ffd93d' : 'rgba(110,110,158,0.45)',
          cursor: 'pointer', fontSize: 13,
          transition: 'color 0.15s, transform 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isPinned ? '★' : '☆'}
      </button>

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

      <div style={{ fontFamily: "'Outfit', 'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: nodeColor, letterSpacing: '-0.01em', marginBottom: 3, paddingRight: 22, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {node.name}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(110,110,158,0.55)', marginBottom: 10, wordBreak: 'break-all', lineHeight: 1.5 }}>
        {displayPath}
      </div>

      <div style={{ height: 1, background: 'rgba(124,157,245,0.08)', margin: '0 0 10px' }} />

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
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: isHov ? 'rgba(124,157,245,0.16)' : 'rgba(124,157,245,0.07)',
                  border: `1px solid ${isHov ? 'rgba(124,157,245,0.38)' : 'rgba(124,157,245,0.18)'}`,
                  color: isHov ? '#e2e2f2' : st.color,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
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

      {node.type === 'file' && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: MONO, fontSize: 8,
            color: 'rgba(110,110,158,0.5)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>Preview</div>

          {preview.loading && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.4)', padding: '8px 0' }}>
              loading…
            </div>
          )}

          {preview.error && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(200,80,80,0.6)' }}>
              {preview.error}
            </div>
          )}

          {preview.lines && (
            <>
              <div style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(124,157,245,0.1)',
                borderRadius: 6,
                padding: '8px 10px',
                maxHeight: 180,
                overflowY: 'auto',
                overflowX: 'hidden',
              }}>
                {preview.lines.map((line, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, lineHeight: 1.55 }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 9,
                      color: 'rgba(110,110,158,0.3)',
                      userSelect: 'none', flexShrink: 0,
                      width: 24, textAlign: 'right', paddingTop: 1,
                    }}>{i + 1}</span>
                    <span style={{
                      fontFamily: MONO, fontSize: 9.5,
                      color: 'rgba(200,210,240,0.75)',
                      whiteSpace: 'pre', overflow: 'hidden',
                      textOverflow: 'ellipsis', display: 'block',
                      maxWidth: 190,
                    }}>{line || ' '}</span>
                  </div>
                ))}
              </div>
              {preview.truncated && (
                <div style={{
                  fontFamily: MONO, fontSize: 8,
                  color: 'rgba(110,110,158,0.4)',
                  marginTop: 4, textAlign: 'right',
                }}>
                  showing 60 of {preview.total} lines
                </div>
              )}
            </>
          )}
        </div>
      )}

      {(activeSignals.includes('gitDirty') || activeSignals.includes('gitUnpushed')) && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            fontFamily: MONO, fontSize: 8,
            color: 'rgba(110,110,158,0.5)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>Git changes</div>

          {gitDiff.loading && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.4)' }}>
              loading…
            </div>
          )}

          {gitDiff.summary && (
            <div style={{
              fontFamily: MONO, fontSize: 9,
              color: 'rgba(200,200,230,0.6)',
              marginBottom: 6, lineHeight: 1.5,
            }}>{gitDiff.summary}</div>
          )}

          {gitDiff.diff && gitDiff.diff.length > 0 && (
            <div style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(124,157,245,0.1)',
              borderRadius: 6,
              padding: '6px 10px',
              maxHeight: 140,
              overflowY: 'auto',
            }}>
              {gitDiff.diff.map((line, i) => {
                const isAdd  = line.startsWith('+') && !line.startsWith('+++')
                const isDel  = line.startsWith('-') && !line.startsWith('---')
                const isHunk = line.startsWith('@@')
                return (
                  <div key={i} style={{
                    fontFamily: MONO, fontSize: 8.5,
                    lineHeight: 1.5,
                    color: isAdd  ? 'rgba(78,205,196,0.8)'
                         : isDel  ? 'rgba(255,107,107,0.7)'
                         : isHunk ? 'rgba(124,157,245,0.6)'
                         :          'rgba(160,160,200,0.45)',
                    whiteSpace: 'pre', overflow: 'hidden',
                    textOverflow: 'ellipsis', maxWidth: 210,
                  }}>{line || ' '}</div>
                )
              })}
            </div>
          )}

          {gitDiff.error && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(200,80,80,0.6)' }}>
              {gitDiff.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
