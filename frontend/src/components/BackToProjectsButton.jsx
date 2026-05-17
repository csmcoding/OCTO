export default function BackToProjectsButton({ onReset, visible }) {
  if (!visible) return null

  return (
    <button
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        background: 'rgba(10, 10, 30, 0.85)',
        border: '1px solid #4A90D9',
        borderRadius: 6,
        padding: '8px 16px',
        color: '#4A90D9',
        fontFamily: 'monospace',
        fontSize: 14,
        cursor: 'pointer',
        zIndex: 100,
      }}
      onClick={onReset}
    >
      ← Back to projects
    </button>
  )
}
