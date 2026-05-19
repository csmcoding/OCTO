import { CLUSTERS } from '../utils/archClassify.js'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"

export default function ArchLegend({ summary = null, colorTheme = 'dark' }) {
  const isLight = colorTheme === 'light'
  return (
    <div style={{
      position: 'fixed',
      bottom: 210,
      left: 20,
      zIndex: 82,
      background: isLight ? 'rgba(235,242,252,0.92)' : 'rgba(18,21,30,0.76)',
      border: `1px solid ${isLight ? 'rgba(0,96,128,0.12)' : 'rgba(124,157,245,0.12)'}`,
      borderRadius: 8,
      backdropFilter: 'blur(12px)',
      padding: '8px 12px',
      minWidth: 148,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: MONO, fontSize: 8,
        color: isLight ? 'rgba(80,40,160,0.7)' : 'rgba(167,139,250,0.85)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: 5,
        fontWeight: 600,
      }}>
        Architecture mode
      </div>
      {Object.entries(CLUSTERS).map(([key, { color, label }]) => {
        const count = summary?.[key]
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: color, flexShrink: 0,
            }} />
            <span style={{
              fontFamily: MONO, fontSize: 9,
              color: isLight ? 'rgba(30,60,100,0.7)' : 'rgba(180,185,225,0.65)',
              letterSpacing: '0.02em', flex: 1,
            }}>{label}</span>
            {count != null && count > 0 && (
              <span style={{
                fontFamily: MONO, fontSize: 8,
                color: isLight ? 'rgba(30,60,100,0.4)' : 'rgba(140,145,190,0.5)',
              }}>{count}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
