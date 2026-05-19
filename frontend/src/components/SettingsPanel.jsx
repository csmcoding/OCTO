import { useState } from 'react'

const MONO = "'JetBrains Mono', 'Fira Code', monospace"
const SANS = "'Outfit', 'Inter', sans-serif"

function Toggle({ on, onChange, label, description, isLight = false }) {
  const sepColor = isLight ? 'rgba(0,96,128,0.08)' : 'rgba(124,157,245,0.07)'
  const labelColor = on
    ? (isLight ? '#1a2a3a' : '#e2e2f2')
    : (isLight ? 'rgba(30,60,100,0.5)' : 'rgba(160,160,200,0.65)')
  const descColor = isLight ? 'rgba(30,60,100,0.4)' : 'rgba(110,110,158,0.5)'
  const trackBg = on ? 'rgba(78,205,196,0.7)' : (isLight ? 'rgba(0,80,120,0.15)' : 'rgba(110,110,158,0.25)')
  const trackBdr = on ? 'rgba(78,205,196,0.9)' : (isLight ? 'rgba(0,80,120,0.2)' : 'rgba(110,110,158,0.35)')
  const thumbBg = on ? '#fff' : (isLight ? 'rgba(0,80,120,0.4)' : 'rgba(160,160,200,0.5)')
  return (
    <label style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: 12,
      padding: '8px 0',
      borderBottom: `1px solid ${sepColor}`,
      cursor: 'pointer',
    }}>
      <div>
        <div style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 500,
          color: labelColor,
          transition: 'color 0.15s',
        }}>{label}</div>
        {description && (
          <div style={{
            fontFamily: MONO, fontSize: 9,
            color: descColor,
            marginTop: 2, lineHeight: 1.4,
          }}>{description}</div>
        )}
      </div>
      <div
        onClick={onChange}
        style={{
          width: 32, height: 18, borderRadius: 9,
          background: trackBg,
          border: `1px solid ${trackBdr}`,
          position: 'relative', flexShrink: 0,
          transition: 'background 0.2s, border-color 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2, left: on ? 15 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: thumbBg,
          transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: on ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
        }} />
      </div>
    </label>
  )
}

function Slider({ value, min, max, step = 1, onChange, label, description, format = v => v, isLight = false }) {
  const sepColor = isLight ? 'rgba(0,96,128,0.08)' : 'rgba(124,157,245,0.07)'
  const labelColor = isLight ? 'rgba(30,60,100,0.8)' : 'rgba(200,200,230,0.8)'
  const valueColor = isLight ? 'rgba(0,80,120,0.8)' : 'rgba(124,157,245,0.8)'
  const descColor  = isLight ? 'rgba(30,60,100,0.4)' : 'rgba(110,110,158,0.5)'
  const endColor   = isLight ? 'rgba(30,60,100,0.3)' : 'rgba(110,110,158,0.35)'
  return (
    <div style={{ padding: '8px 0', borderBottom: `1px solid ${sepColor}` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 6,
      }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: labelColor }}>
          {label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: valueColor }}>
          {format(value)}
        </div>
      </div>
      {description && (
        <div style={{
          fontFamily: MONO, fontSize: 9,
          color: descColor,
          marginBottom: 6, lineHeight: 1.4,
        }}>{description}</div>
      )}
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4ecdc4', cursor: 'pointer' }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: MONO, fontSize: 8,
        color: endColor,
        marginTop: 2,
      }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function ThemeSelector({ value, onChange, isLight = false }) {
  const themes = [
    { id: 'dark',      label: 'Dark',               preview: ['#0a0a18', '#171628', '#4ecdc4'] },
    { id: 'deepspace', label: 'Deep Space',          preview: ['#04040f', '#0d0d24', '#7c9df5'] },
    { id: 'light',     label: 'Light — Future Glass',preview: ['#e8edf5', '#d4dce9', '#006080'] },
  ]
  const sectionColor = isLight ? 'rgba(30,60,100,0.8)' : 'rgba(200,200,230,0.8)'
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        fontFamily: SANS, fontSize: 12, fontWeight: 500,
        color: sectionColor, marginBottom: 8,
      }}>Color theme</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {themes.map(t => {
          const active = value === t.id
          const btnBg  = active
            ? (isLight ? 'rgba(0,96,128,0.12)' : 'rgba(124,157,245,0.12)')
            : (isLight ? 'rgba(0,96,128,0.04)'  : 'rgba(110,110,158,0.06)')
          const btnBdr = active
            ? (isLight ? 'rgba(0,96,128,0.4)'   : 'rgba(124,157,245,0.4)')
            : (isLight ? 'rgba(0,96,128,0.15)'   : 'rgba(110,110,158,0.2)')
          const txtColor = active
            ? (isLight ? '#1a2a3a' : '#e2e2f2')
            : (isLight ? 'rgba(30,60,100,0.5)' : 'rgba(110,110,158,0.6)')
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                flex: 1, padding: '6px 8px',
                background: btnBg,
                border: `1px solid ${btnBdr}`,
                borderRadius: 7, cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{ display: 'flex', gap: 3, marginBottom: 5, justifyContent: 'center' }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{
                    width: i === 2 ? 8 : 12, height: 8, borderRadius: 3,
                    background: c,
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
              <div style={{
                fontFamily: MONO, fontSize: 9,
                color: txtColor,
                textAlign: 'center', letterSpacing: '0.04em',
              }}>{t.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPanel({ settings, setSetting, onClose, onRescan }) {
  const [rescanning, setRescanning] = useState(false)
  const isLight = settings.colorTheme === 'light'

  const handleRescan = async () => {
    setRescanning(true)
    try { await onRescan?.() } finally { setRescanning(false) }
  }

  const panelBg     = isLight ? 'rgba(240,245,252,0.97)' : 'rgba(6,6,18,0.97)'
  const panelBorder = isLight ? 'rgba(0,96,128,0.16)'    : 'rgba(124,157,245,0.18)'
  const panelShadow = isLight ? '0 8px 32px rgba(0,60,100,0.14)' : '0 16px 48px rgba(0,0,0,0.8)'
  const titleColor  = isLight ? '#1a2a3a'                : '#e2e2f2'
  const closeColor  = isLight ? 'rgba(30,60,100,0.45)'   : 'rgba(110,110,158,0.5)'
  const closeHov    = isLight ? '#1a2a3a'                : '#e2e2f2'

  const btnIdleBg   = isLight ? 'rgba(0,96,128,0.04)'    : 'rgba(110,110,158,0.06)'
  const btnIdleBdr  = isLight ? 'rgba(0,96,128,0.14)'    : 'rgba(110,110,158,0.18)'
  const btnIdleClr  = isLight ? 'rgba(30,60,100,0.5)'    : 'rgba(110,110,158,0.5)'
  const btnHovReset = isLight ? 'rgba(0,96,128,0.08)'    : 'rgba(124,157,245,0.08)'
  const btnHovClrReset = isLight ? 'rgba(0,60,100,0.8)'  : 'rgba(160,160,220,0.8)'

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95 }} />

      <div style={{
        position: 'fixed',
        bottom: 132,
        left: 20,
        zIndex: 96,
        width: 260,
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        borderRadius: 12,
        backdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: panelShadow,
        padding: '14px 16px',
        animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontFamily: SANS, fontSize: 13, fontWeight: 600,
              color: titleColor, letterSpacing: '-0.01em',
            }}>Settings</div>
            {(settings.activityMode || settings.archMode) && (
              <span style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 600,
                color: settings.activityMode ? '#ff6b35' : '#a78bfa',
                background: settings.activityMode ? 'rgba(255,107,53,0.12)' : 'rgba(167,139,250,0.12)',
                border: `1px solid ${settings.activityMode ? 'rgba(255,107,53,0.3)' : 'rgba(167,139,250,0.3)'}`,
                borderRadius: 4, padding: '1px 6px',
                letterSpacing: '0.04em',
              }}>
                {settings.activityMode ? 'Activity' : 'Architecture'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: closeColor, cursor: 'pointer',
              fontSize: 14, padding: '2px 6px', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = closeHov}
            onMouseLeave={e => e.currentTarget.style.color = closeColor}
          >×</button>
        </div>

        <Toggle isLight={isLight}
          on={settings.autoRotate}
          onChange={() => setSetting('autoRotate', !settings.autoRotate)}
          label="Auto-rotation"
          description="Slowly orbits the scene camera"
        />
        <Toggle isLight={isLight}
          on={settings.showLabels}
          onChange={() => setSetting('showLabels', !settings.showLabels)}
          label="Node labels"
          description="Show name below each node"
        />
        <Toggle isLight={isLight}
          on={settings.sway}
          onChange={() => setSetting('sway', !settings.sway)}
          label="Tentacle sway"
          description="Organic idle animation"
        />
        <Toggle isLight={isLight}
          on={settings.activityMode}
          onChange={() => {
            const next = !settings.activityMode
            setSetting('activityMode', next)
            if (next) setSetting('archMode', false)
          }}
          label="Activity mode  [T]"
          description="Overlay git recency and churn"
        />
        <Toggle isLight={isLight}
          on={settings.archMode}
          onChange={() => {
            const next = !settings.archMode
            setSetting('archMode', next)
            if (next) setSetting('activityMode', false)
          }}
          label="Architecture mode  [A]"
          description="Color nodes by code category"
        />
        <Slider isLight={isLight}
          value={settings.scanDepth}
          min={1} max={5}
          label="Scan depth"
          description="Directory levels scanned on drill-in"
          onChange={v => setSetting('scanDepth', v)}
          format={v => `${v} ${v === 1 ? 'level' : 'levels'}`}
        />
        <ThemeSelector isLight={isLight}
          value={settings.colorTheme}
          onChange={v => setSetting('colorTheme', v)}
        />

        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <button
            onClick={handleRescan}
            disabled={rescanning}
            style={{
              flex: 1, padding: '6px 0',
              background: rescanning ? 'rgba(78,205,196,0.08)' : btnIdleBg,
              border: `1px solid ${rescanning ? 'rgba(78,205,196,0.35)' : btnIdleBdr}`,
              borderRadius: 6, cursor: rescanning ? 'default' : 'pointer',
              fontFamily: MONO, fontSize: 9,
              color: rescanning ? 'rgba(78,205,196,0.8)' : btnIdleClr,
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!rescanning) {
                e.currentTarget.style.background = 'rgba(78,205,196,0.08)'
                e.currentTarget.style.color = 'rgba(78,205,196,0.8)'
              }
            }}
            onMouseLeave={e => {
              if (!rescanning) {
                e.currentTarget.style.background = btnIdleBg
                e.currentTarget.style.color = btnIdleClr
              }
            }}
          >{rescanning ? 'rescanning…' : 'rescan  [R]'}</button>
          <button
            onClick={() => {
              setSetting('autoRotate', true)
              setSetting('showLabels', true)
              setSetting('sway', true)
              setSetting('scanDepth', 2)
              setSetting('colorTheme', 'dark')
              setSetting('activityMode', false)
              setSetting('archMode', false)
            }}
            title="Reset to dark theme defaults"
            style={{
              flex: 1, padding: '6px 0',
              background: btnIdleBg,
              border: `1px solid ${btnIdleBdr}`,
              borderRadius: 6, cursor: 'pointer',
              fontFamily: MONO, fontSize: 9,
              color: btnIdleClr,
              letterSpacing: '0.04em',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = btnHovReset
              e.currentTarget.style.color = btnHovClrReset
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = btnIdleBg
              e.currentTarget.style.color = btnIdleClr
            }}
          >reset</button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
