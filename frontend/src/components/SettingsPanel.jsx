import { useState } from 'react'

const MONO = "'JetBrains Mono', 'Fira Code', monospace"
const SANS = "'Outfit', 'Inter', sans-serif"

function Toggle({ on, onChange, label, description }) {
  return (
    <label style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-start', gap: 12,
      padding: '8px 0',
      borderBottom: '1px solid rgba(124,157,245,0.07)',
      cursor: 'pointer',
    }}>
      <div>
        <div style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 500,
          color: on ? '#e2e2f2' : 'rgba(160,160,200,0.65)',
          transition: 'color 0.15s',
        }}>{label}</div>
        {description && (
          <div style={{
            fontFamily: MONO, fontSize: 9,
            color: 'rgba(110,110,158,0.5)',
            marginTop: 2, lineHeight: 1.4,
          }}>{description}</div>
        )}
      </div>
      <div
        onClick={onChange}
        style={{
          width: 32, height: 18, borderRadius: 9,
          background: on ? 'rgba(78,205,196,0.7)' : 'rgba(110,110,158,0.25)',
          border: `1px solid ${on ? 'rgba(78,205,196,0.9)' : 'rgba(110,110,158,0.35)'}`,
          position: 'relative', flexShrink: 0,
          transition: 'background 0.2s, border-color 0.2s',
          cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 2, left: on ? 15 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: on ? '#fff' : 'rgba(160,160,200,0.5)',
          transition: 'left 0.2s cubic-bezier(0.16,1,0.3,1)',
          boxShadow: on ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
        }} />
      </div>
    </label>
  )
}

function Slider({ value, min, max, step = 1, onChange, label, description, format = v => v }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(124,157,245,0.07)' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 6,
      }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: 'rgba(200,200,230,0.8)' }}>
          {label}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(124,157,245,0.8)' }}>
          {format(value)}
        </div>
      </div>
      {description && (
        <div style={{
          fontFamily: MONO, fontSize: 9,
          color: 'rgba(110,110,158,0.5)',
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
        color: 'rgba(110,110,158,0.35)',
        marginTop: 2,
      }}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function ThemeSelector({ value, onChange }) {
  const themes = [
    { id: 'dark',      label: 'Dark',       preview: ['#0a0a18', '#171628', '#4ecdc4'] },
    { id: 'deepspace', label: 'Deep Space', preview: ['#04040f', '#0d0d24', '#7c9df5'] },
  ]
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        fontFamily: SANS, fontSize: 12, fontWeight: 500,
        color: 'rgba(200,200,230,0.8)', marginBottom: 8,
      }}>Color theme</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {themes.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1, padding: '6px 8px',
              background: value === t.id ? 'rgba(124,157,245,0.12)' : 'rgba(110,110,158,0.06)',
              border: `1px solid ${value === t.id ? 'rgba(124,157,245,0.4)' : 'rgba(110,110,158,0.2)'}`,
              borderRadius: 7, cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', gap: 3, marginBottom: 5, justifyContent: 'center' }}>
              {t.preview.map((c, i) => (
                <div key={i} style={{
                  width: i === 2 ? 8 : 12, height: 8, borderRadius: 3,
                  background: c, border: '1px solid rgba(255,255,255,0.1)',
                }} />
              ))}
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 9,
              color: value === t.id ? '#e2e2f2' : 'rgba(110,110,158,0.6)',
              textAlign: 'center', letterSpacing: '0.04em',
            }}>{t.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPanel({ settings, setSetting, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 95 }} />

      <div style={{
        position: 'fixed',
        bottom: 56,
        left: 20,
        zIndex: 96,
        width: 260,
        background: 'rgba(6,6,18,0.97)',
        border: '1px solid rgba(124,157,245,0.18)',
        borderRadius: 12,
        backdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
        padding: '14px 16px',
        animation: 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 12,
        }}>
          <div style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            color: '#e2e2f2', letterSpacing: '-0.01em',
          }}>Settings</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(110,110,158,0.5)', cursor: 'pointer',
              fontSize: 14, padding: '2px 6px', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e2f2'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(110,110,158,0.5)'}
          >×</button>
        </div>

        <Toggle
          on={settings.autoRotate}
          onChange={() => setSetting('autoRotate', !settings.autoRotate)}
          label="Auto-rotation"
          description="Slowly orbits the scene camera"
        />
        <Toggle
          on={settings.showLabels}
          onChange={() => setSetting('showLabels', !settings.showLabels)}
          label="Node labels"
          description="Show name below each node"
        />
        <Toggle
          on={settings.sway}
          onChange={() => setSetting('sway', !settings.sway)}
          label="Tentacle sway"
          description="Organic idle animation"
        />
        <Slider
          value={settings.scanDepth}
          min={1} max={5}
          label="Scan depth"
          description="Directory levels scanned on drill-in"
          onChange={v => setSetting('scanDepth', v)}
          format={v => `${v} ${v === 1 ? 'level' : 'levels'}`}
        />
        <ThemeSelector
          value={settings.colorTheme}
          onChange={v => setSetting('colorTheme', v)}
        />

        <button
          onClick={() => {
            setSetting('autoRotate', true)
            setSetting('showLabels', true)
            setSetting('sway', true)
            setSetting('scanDepth', 2)
            setSetting('colorTheme', 'dark')
          }}
          style={{
            marginTop: 12, width: '100%',
            padding: '6px 0',
            background: 'rgba(110,110,158,0.06)',
            border: '1px solid rgba(110,110,158,0.18)',
            borderRadius: 6, cursor: 'pointer',
            fontFamily: MONO, fontSize: 9,
            color: 'rgba(110,110,158,0.5)',
            letterSpacing: '0.04em',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(124,157,245,0.08)'
            e.currentTarget.style.color = 'rgba(160,160,220,0.8)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(110,110,158,0.06)'
            e.currentTarget.style.color = 'rgba(110,110,158,0.5)'
          }}
        >reset to defaults</button>
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
