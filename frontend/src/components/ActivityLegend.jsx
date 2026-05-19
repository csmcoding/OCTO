const MONO = "'JetBrains Mono', 'Fira Mono', monospace"

const LEGEND_ITEMS = [
  { key: 'hot',   color: '#ff6b35', label: 'Active today'      },
  { key: 'warm',  color: '#c8a020', label: 'Active this week'  },
  { key: 'cool',  color: '#4a9090', label: 'Active this month' },
  { key: null,    color: '#e8a020', label: 'Dirty'              },
  { key: 'stale', color: '#555570', label: 'Quiet / stale'     },
]

export default function ActivityLegend({ summary, unavailable, levelCounts = null, colorTheme = 'dark' }) {
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
      {unavailable ? (
        <div style={{
          fontFamily: MONO, fontSize: 9,
          color: isLight ? 'rgba(100,60,20,0.7)' : 'rgba(180,140,100,0.7)',
          lineHeight: 1.4,
        }}>
          Activity mode requires<br />a git repository
        </div>
      ) : (
        <>
          <div style={{
            fontFamily: MONO, fontSize: 8,
            color: isLight ? 'rgba(0,80,140,0.6)' : 'rgba(255,107,53,0.8)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: summary ? 4 : 6,
            fontWeight: 600,
          }}>
            Activity mode
          </div>
          {summary && (
            <div style={{
              fontFamily: MONO, fontSize: 8,
              color: isLight ? 'rgba(30,60,100,0.55)' : 'rgba(160,165,210,0.6)',
              marginBottom: 6,
              lineHeight: 1.5,
              letterSpacing: '0.02em',
            }}>
              {summary}
            </div>
          )}
          {LEGEND_ITEMS.map(({ key, color, label }) => {
            const count = key && levelCounts ? (levelCounts[key] ?? 0) : null
            return (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: MONO, fontSize: 9, flex: 1,
                  color: isLight ? 'rgba(30,60,100,0.7)' : 'rgba(180,185,225,0.65)',
                  letterSpacing: '0.02em',
                }}>{label}</span>
                {count !== null && count > 0 && (
                  <span style={{
                    fontFamily: MONO, fontSize: 8,
                    color: color,
                    opacity: 0.75,
                    minWidth: 14, textAlign: 'right',
                  }}>{count}</span>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
