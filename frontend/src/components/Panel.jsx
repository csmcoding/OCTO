import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'

export default function Panel({ node, onClose }) {
  const displayPath = node.path.length > 60
    ? '...' + node.path.slice(-60)
    : node.path

  const activeSignals = getActiveSignals(node)

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
      <div style={{ marginBottom: 8 }}>
        {activeSignals.length === 0 ? (
          <span style={{ fontSize: 12, color: '#44ff88' }}>✓ Clean</span>
        ) : (
          activeSignals.map(key => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: SIGNAL_COLORS[key],
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: SIGNAL_COLORS[key] }}>
                {SIGNAL_LABELS[key]}
              </span>
            </div>
          ))
        )}
      </div>
      <div>
        <button
          style={{
            background: '#4A90D9',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 12,
            marginRight: 8,
          }}
          onClick={() => console.log('OPEN:', node.path)}
        >
          Open in editor
        </button>
        <button
          style={{
            background: 'transparent',
            color: '#888',
            border: '1px solid #444',
            padding: '8px 14px',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 12,
          }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  )
}
