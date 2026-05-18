export default function OctoWordmark() {
  return (
    <div style={{
      position: 'fixed',
      top: 16,
      left: 20,
      zIndex: 150,
      display: 'flex',
      alignItems: 'baseline',
      gap: 5,
      userSelect: 'none',
      pointerEvents: 'none',
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono','Fira Mono',monospace",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.18em',
        color: '#e8e8f8',
      }}>
        OCTO
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono','Fira Mono',monospace",
        fontSize: 8,
        fontWeight: 400,
        letterSpacing: '0.06em',
        color: 'rgba(74,144,217,0.55)',
        textTransform: 'uppercase',
      }}>
        uptonogood
      </span>
    </div>
  )
}
