export default function OctoWordmark() {
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 18,
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const angle = (i / 8) * Math.PI * 2
          const x1 = 8 + Math.cos(angle) * 2.5
          const y1 = 8 + Math.sin(angle) * 2.5
          const x2 = 8 + Math.cos(angle) * 7
          const y2 = 8 + Math.sin(angle) * 7
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="white" strokeWidth="1.5"
              strokeLinecap="round" opacity={0.85}
            />
          )
        })}
        <circle cx="8" cy="8" r="2" fill="white" opacity={0.9} />
      </svg>

      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        fontWeight: 700,
        letterSpacing: '0.2em',
        color: '#e2e2f2',
      }}>OCTO</span>

      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        fontWeight: 400,
        letterSpacing: '0.08em',
        color: 'rgba(110,110,158,0.7)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: 'calc(100vw - 200px)',
      }}>Organizational Code Topology Observer</span>
    </div>
  )
}
