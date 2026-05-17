export default function Panel({ node, onClose }) {
  const displayPath = node.path.length > 60
    ? '...' + node.path.slice(-60)
    : node.path

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
      <p style={{ margin: '0 0 4px 0', fontSize: 13, color: node.gitDirty ? '#FF8C00' : '#44ff88' }}>
        {node.gitDirty ? '⚠ Dirty — uncommitted changes' : '✓ Clean'}
      </p>
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
