import { useState, useEffect, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import Tentacle from './Tentacle'
import { buildTentacleLayout } from '../utils/buildTentacleLayout'

const MONO = "'JetBrains Mono', 'Fira Code', monospace"
const SANS = "'Outfit', 'Inter', sans-serif"

const DEMO_NODES = Array.from({ length: 6 }, (_, i) => ({
  id: `demo-${i}`, name: '', type: 'folder', signals: {},
}))
const DEMO_COLORS = ['#4ecdc4', '#c8a2ff', '#7c9df5', '#4ecdc4', '#c8a2ff', '#7c9df5']

function DemoOrb() {
  const layout = useMemo(() => buildTentacleLayout(DEMO_NODES, 3.2), [])
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a2e" emissive="#4ecdc4"
          emissiveIntensity={0.28} roughness={0.2} metalness={0.5}
        />
      </mesh>
      {layout.map((d, i) => (
        <Tentacle
          key={i}
          curve={d.curve}
          basePoints={d.basePoints}
          index={d.index ?? i}
          color={DEMO_COLORS[i % DEMO_COLORS.length]}
          hovered={false}
          nodeCount={6}
          sway={true}
        />
      ))}
    </group>
  )
}

function OctoLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const angle = (i / 8) * Math.PI * 2
        const x1 = 8 + Math.cos(angle) * 2.5
        const y1 = 8 + Math.sin(angle) * 2.5
        const x2 = 8 + Math.cos(angle) * 7
        const y2 = 8 + Math.sin(angle) * 7
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#e2e2f2" strokeWidth="1.5" strokeLinecap="round" opacity={0.85} />
      })}
      <circle cx="8" cy="8" r="2" fill="#e2e2f2" opacity={0.9} />
    </svg>
  )
}

function SkeletonRows() {
  return (
    <>
      {[1, 0.7, 0.85].map((op, i) => (
        <div key={i} style={{
          height: 44, borderRadius: 8, marginBottom: 6,
          background: `rgba(124,157,245,${op * 0.06})`,
          animation: 'pulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </>
  )
}

export default function Onboarding({ onRootSelect }) {
  const [view, setView]           = useState('WELCOME') // WELCOME | BROWSING | LOADING
  const [inputPath, setInputPath] = useState('')
  const [validation, setValidation] = useState(null)   // null | {valid,name}
  const [recents, setRecents]     = useState([])
  const [browse, setBrowse]       = useState(null)     // {path, parent, entries}
  const [browseLoading, setBrowseLoading] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(0)
  const debounceRef = useRef(null)
  const listRef     = useRef(null)

  useEffect(() => {
    fetch('/api/recents')
      .then(r => r.json())
      .then(d => setRecents(d.recents ?? []))
      .catch(() => {})
  }, [])

  const validateInput = (val) => {
    setInputPath(val)
    setValidation(null)
    clearTimeout(debounceRef.current)
    if (!val.trim()) return
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/validate?path=${encodeURIComponent(val)}`)
        setValidation(await r.json())
      } catch {}
    }, 400)
  }

  const fetchBrowse = async (path) => {
    setBrowseLoading(true)
    try {
      const r = await fetch(`/api/browse?path=${encodeURIComponent(path)}`)
      const d = await r.json()
      if (!d.error) { setBrowse(d); setFocusedIdx(0) }
    } catch {}
    setBrowseLoading(false)
  }

  const openBrowser = async () => {
    setView('BROWSING')
    setBrowseLoading(true)
    try {
      const url = inputPath.trim()
        ? `/api/browse?path=${encodeURIComponent(inputPath.trim())}`
        : '/api/browse'
      const r = await fetch(url)
      const d = await r.json()
      if (!d.error) { setBrowse(d); setFocusedIdx(0) }
    } catch {}
    setBrowseLoading(false)
  }

  const handleOpen = (path) => {
    setView('LOADING')
    onRootSelect(path)
  }

  const selectBrowseFolder = (path) => {
    setInputPath(path)
    setValidation({ valid: true, name: path.split('/').pop() })
    setView('WELCOME')
  }

  useEffect(() => {
    if (view !== 'BROWSING') return
    const handler = (e) => {
      const count = browse?.entries?.length ?? 0
      if (e.key === 'Escape')      { setView('WELCOME'); return }
      if (e.key === 'Backspace' && browse?.parent) { fetchBrowse(browse.parent); return }
      if (e.key === 'ArrowDown')   { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, count - 1)) }
      if (e.key === 'ArrowUp')     { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && browse?.entries[focusedIdx]) {
        fetchBrowse(browse.entries[focusedIdx].path)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [view, browse, focusedIdx])

  const isValid = validation?.valid === true
  const borderColor = !inputPath ? 'rgba(124,157,245,0.2)'
    : isValid ? 'rgba(78,205,196,0.6)' : 'rgba(200,140,60,0.5)'

  const outerStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: '#070710',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: SANS,
    overflow: 'hidden',
  }

  /* ── LOADING ── */
  if (view === 'LOADING') {
    const name = inputPath.split('/').filter(Boolean).pop() ?? inputPath
    return (
      <div style={outerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'radial-gradient(circle, #4ecdc4, #01696f)',
            margin: '0 auto 20px',
            animation: 'pulse 1.2s ease-in-out infinite',
          }} />
          <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(78,205,196,0.7)' }}>
            scanning {name}…
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%,100% { transform:scale(1); opacity:.8; box-shadow:0 0 0 0 rgba(78,205,196,.4); }
            50%      { transform:scale(1.12); opacity:1; box-shadow:0 0 0 12px rgba(78,205,196,0); }
          }
        `}</style>
      </div>
    )
  }

  /* ── BROWSING ── */
  if (view === 'BROWSING') {
    return (
      <div style={outerStyle}>
        <div style={{
          width: '100%', maxWidth: 560,
          background: 'rgba(10,10,24,0.97)',
          border: '1px solid rgba(124,157,245,0.15)',
          borderRadius: 14,
          padding: '20px 24px',
          backdropFilter: 'blur(24px)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              onClick={() => setView('WELCOME')}
              style={{ background: 'none', border: 'none', color: 'rgba(124,157,245,0.7)', cursor: 'pointer', fontFamily: MONO, fontSize: 11, padding: '4px 8px', borderRadius: 6 }}
            >← back</button>
            <div style={{ flex: 1, fontFamily: MONO, fontSize: 10, color: 'rgba(160,160,200,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {browse?.path ?? '…'}
            </div>
            <button
              onClick={() => browse?.path && selectBrowseFolder(browse.path)}
              style={{
                background: 'rgba(78,205,196,0.1)', border: '1px solid rgba(78,205,196,0.35)',
                borderRadius: 7, color: '#4ecdc4', fontFamily: MONO, fontSize: 10,
                padding: '4px 12px', cursor: 'pointer',
              }}
            >✓ select</button>
          </div>

          {/* Parent nav */}
          {browse?.parent && (
            <div
              onClick={() => fetchBrowse(browse.parent)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 4, color: 'rgba(124,157,245,0.6)', fontFamily: MONO, fontSize: 10 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,157,245,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >↑ ..</div>
          )}

          {/* Entries */}
          <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto' }}>
            {browseLoading ? <SkeletonRows /> : (browse?.entries ?? []).map((e, i) => (
              <div
                key={e.path}
                onClick={() => fetchBrowse(e.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 2,
                  background: i === focusedIdx ? 'rgba(124,157,245,0.09)' : 'transparent',
                  border: `1px solid ${i === focusedIdx ? 'rgba(124,157,245,0.2)' : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setFocusedIdx(i)}
              >
                <span style={{ fontSize: 14 }}>📁</span>
                <span style={{ flex: 1, fontFamily: SANS, fontSize: 13, color: '#e2e2f2' }}>{e.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.5)' }}>
                  {e.childCount > 0 ? `${e.childCount} items` : ''}
                </span>
                <span style={{ color: 'rgba(124,157,245,0.4)', fontSize: 12 }}>›</span>
              </div>
            ))}
            {!browseLoading && browse?.entries?.length === 0 && (
              <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(110,110,158,0.4)', padding: '16px 10px', textAlign: 'center' }}>
                no subdirectories
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── WELCOME ── */
  return (
    <div style={outerStyle}>
      <div style={{
        display: 'flex', gap: 48, alignItems: 'center',
        padding: '0 24px', maxWidth: 820, width: '100%',
        flexWrap: 'wrap', justifyContent: 'center',
      }}>

        {/* Left: form */}
        <div style={{ flex: '1 1 320px', maxWidth: 380 }}>
          {/* Wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <OctoLogo size={32} />
            <span style={{ fontFamily: MONO, fontSize: 36, fontWeight: 700, letterSpacing: '0.15em', color: '#e2e2f2' }}>OCTO</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(110,110,158,0.55)', letterSpacing: '0.06em', marginBottom: 36 }}>
            your codebase. alive.
          </div>

          {/* Path input */}
          <div style={{ marginBottom: 8 }}>
            <input
              type="text"
              value={inputPath}
              onChange={e => validateInput(e.target.value)}
              placeholder="paste a directory path…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(10,10,24,0.9)',
                border: `1px solid ${borderColor}`,
                borderRadius: 8, padding: '10px 14px',
                fontFamily: MONO, fontSize: 12, color: '#e2e2f2',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { if (!inputPath) e.target.style.borderColor = 'rgba(124,157,245,0.4)' }}
              onBlur={e => { if (!inputPath) e.target.style.borderColor = 'rgba(124,157,245,0.2)' }}
            />
            {validation && (
              <div style={{
                fontFamily: MONO, fontSize: 9, marginTop: 5,
                color: isValid ? '#4ecdc4' : 'rgba(200,140,60,0.8)',
                letterSpacing: '0.04em',
              }}>
                {isValid ? `✓ ${validation.name}` : 'directory not found'}
              </div>
            )}
          </div>

          {/* Browse + Open buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            <button
              onClick={openBrowser}
              style={{
                flex: 1, padding: '8px 0',
                background: 'rgba(124,157,245,0.07)',
                border: '1px solid rgba(124,157,245,0.2)',
                borderRadius: 8, cursor: 'pointer',
                fontFamily: MONO, fontSize: 10, color: 'rgba(160,160,220,0.7)',
                letterSpacing: '0.04em',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,157,245,0.12)'; e.currentTarget.style.color = '#e2e2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,157,245,0.07)'; e.currentTarget.style.color = 'rgba(160,160,220,0.7)' }}
            >browse filesystem</button>
            <button
              onClick={() => isValid && handleOpen(inputPath)}
              disabled={!isValid}
              style={{
                padding: '8px 20px',
                background: isValid ? 'rgba(78,205,196,0.12)' : 'rgba(110,110,158,0.06)',
                border: `1px solid ${isValid ? 'rgba(78,205,196,0.45)' : 'rgba(110,110,158,0.15)'}`,
                borderRadius: 8,
                cursor: isValid ? 'pointer' : 'default',
                fontFamily: MONO, fontSize: 10,
                color: isValid ? '#4ecdc4' : 'rgba(110,110,158,0.35)',
                letterSpacing: '0.04em',
                transition: 'all 0.15s',
              }}
            >Open →</button>
          </div>

          {/* Recents */}
          {recents.length > 0 && (
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.45)', letterSpacing: '0.08em', marginBottom: 10 }}>
                recent
              </div>
              {recents.map(r => (
                <button
                  key={r.path}
                  onClick={() => handleOpen(r.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 12px', marginBottom: 4,
                    background: 'rgba(124,157,245,0.04)',
                    border: '1px solid rgba(124,157,245,0.1)',
                    borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,157,245,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,157,245,0.25)'; e.currentTarget.querySelector('.arrow').style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,157,245,0.04)'; e.currentTarget.style.borderColor = 'rgba(124,157,245,0.1)'; e.currentTarget.querySelector('.arrow').style.transform = 'translateX(0)' }}
                >
                  <span style={{ fontSize: 14 }}>📁</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: '#e2e2f2' }}>{r.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.path}</div>
                  </div>
                  <span className="arrow" style={{ color: 'rgba(124,157,245,0.5)', transition: 'transform 0.15s', flexShrink: 0 }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: mini 3D preview */}
        <div style={{ flex: '0 0 auto', opacity: 0.85, pointerEvents: 'none' }}>
          <Canvas
            style={{ width: 280, height: 280, borderRadius: 14, background: 'rgba(3,3,16,0.7)', display: 'block', pointerEvents: 'none' }}
            camera={{ position: [0, 2, 7], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} color="#08083a" />
            <pointLight position={[0, 0, 0]} intensity={3} color="#ffffff" distance={10} decay={2} />
            <pointLight position={[2, 3, 2]} intensity={0.5} color="#7c9df5" distance={12} decay={2} />
            <DemoOrb />
          </Canvas>
          <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(110,110,158,0.3)', textAlign: 'center', marginTop: 8, letterSpacing: '0.06em' }}>
            live preview
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { transform:scale(1); opacity:.8; box-shadow:0 0 0 0 rgba(78,205,196,.4); }
          50%      { transform:scale(1.12); opacity:1; box-shadow:0 0 0 12px rgba(78,205,196,0); }
        }
      `}</style>
    </div>
  )
}
