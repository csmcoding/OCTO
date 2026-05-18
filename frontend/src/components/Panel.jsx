import { useState, useEffect } from 'react'
import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'
import { getNodeColor } from '../utils/palette'
import { openNode } from '../utils/loadTree'
import { useGitDiff } from '../hooks/useGitDiff'
import { summarizeActivity } from '../utils/loadActivity'
import { getActivityLevel } from '../utils/activityAggregate'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SANS = "'Outfit', 'Inter', system-ui, sans-serif"

const EXT_LANG = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', json: 'json', css: 'css', scss: 'css',
  md: 'markdown', sh: 'bash', bash: 'bash',
  html: 'markup', xml: 'markup', yaml: 'yaml', yml: 'yaml',
  rs: 'rust', go: 'go', java: 'java', c: 'c', cpp: 'cpp',
  rb: 'ruby', php: 'php', swift: 'swift', kt: 'kotlin',
}

export function detectLang(path = '') {
  const ext = (path.split('.').pop() ?? '').toLowerCase()
  return EXT_LANG[ext] ?? 'text'
}

export function buildTypeBadge(node) {
  return node.type === 'folder' ? 'folder' : 'file'
}

export function buildMetrics(node, activeSignals, depth) {
  const folderCount = node.type === 'folder'
    ? (node.childCount ?? node.children?.length ?? 0)
    : 0
  const fileCount = (node.children ?? []).filter(c => c.type === 'file').length
  return [
    node.type === 'folder' && folderCount > 0 && { icon: '📁', value: folderCount, label: 'children' },
    node.type === 'folder' && fileCount > 0    && { icon: '📄', value: fileCount,   label: 'files'    },
    activeSignals.length > 0                   && { icon: '⚠️', value: activeSignals.length, label: 'signals' },
    depth > 0                                  && { icon: '↕',  value: depth,        label: 'depth'    },
  ].filter(Boolean)
}

export function buildActions(node, { onDrillIn, onRescan, onExport } = {}) {
  return [
    node.type === 'folder' && onDrillIn && { key: 'drill',  icon: '⟫', label: 'Drill in',   onClick: () => onDrillIn(node) },
    onRescan                             && { key: 'rescan', icon: '↻', label: 'Rescan',      onClick: onRescan },
                                            { key: 'copy',   icon: '⧉', label: 'Copy path',  onClick: null },
    onExport                             && { key: 'export', icon: '↓', label: 'Export',      onClick: onExport },
  ].filter(Boolean)
}

// Prism singleton — loaded once from CDN at runtime, fails gracefully in tests
let _prismPromise = null
function loadPrism() {
  if (_prismPromise) return _prismPromise
  _prismPromise = import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0')
    .then(async mod => {
      const P = mod.default
      await Promise.allSettled([
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-jsx.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-typescript.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-tsx.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-python.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-bash.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-yaml.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-markdown.js'),
        import(/* @vite-ignore */ 'https://esm.sh/prismjs@1.29.0/components/prism-rust.js'),
      ])
      if (!document.getElementById('prism-theme')) {
        const link = document.createElement('link')
        link.id = 'prism-theme'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css'
        document.head.appendChild(link)
      }
      return P
    })
    .catch(() => null)
  return _prismPromise
}

function usePanelPreview(node) {
  const [state, setState] = useState({
    content: null, language: 'text',
    truncated: false, total: 0,
    loading: false, error: null,
  })
  useEffect(() => {
    if (!node || node.type !== 'file' || !node.path) {
      setState({ content: null, language: 'text', truncated: false, total: 0, loading: false, error: null })
      return
    }
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))
    fetch(`/api/preview?path=${encodeURIComponent(node.path)}&lines=20`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.detail || data.error) {
          setState(s => ({ ...s, loading: false, error: data.detail ?? data.error }))
        } else {
          setState({
            content: data.content, language: data.language ?? 'text',
            truncated: data.truncated, total: data.total_lines ?? 0,
            loading: false, error: null,
          })
        }
      })
      .catch(e => { if (!cancelled) setState(s => ({ ...s, loading: false, error: e.message })) })
    return () => { cancelled = true }
  }, [node?.path, node?.type])
  return state
}

function MetricChip({ icon, value, label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(78,205,196,0.18)',
      borderRadius: 8, padding: '6px 10px', minWidth: 52, gap: 2,
    }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: '#e2e2f2', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.6)', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  )
}

const SIGNAL_HUMAN = {
  ...SIGNAL_LABELS,
  largefile: 'Large file',
  todoDensity: 'High TODO density',
  deepNesting: 'Deep nesting',
}

function SignalRow({ signalKey }) {
  const [hov, setHov] = useState(false)
  const color = SIGNAL_COLORS[signalKey] ?? '#888'
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 6px', borderRadius: 6, marginBottom: 1,
        background: hov ? 'rgba(78,205,196,0.06)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontFamily: MONO, fontSize: 11, color, flex: 1 }}>
        {SIGNAL_HUMAN[signalKey] ?? signalKey}
      </span>
    </div>
  )
}

function FilePreviewSection({ node }) {
  const preview = usePanelPreview(node)
  const [prism, setPrism] = useState(null)
  const [highlighted, setHighlighted] = useState([])
  const [openStatus, setOpenStatus] = useState('idle')
  const lang = detectLang(node.path)

  useEffect(() => {
    loadPrism().then(P => { if (P) setPrism(P) })
  }, [])

  useEffect(() => {
    if (!preview.content) { setHighlighted([]); return }
    if (!prism) { setHighlighted(preview.content.split('\n')); return }
    try {
      const grammar = prism.languages[lang] ?? null
      if (!grammar) { setHighlighted(preview.content.split('\n')); return }
      const html = prism.highlight(preview.content, grammar, lang)
      setHighlighted(html.split('\n'))
    } catch {
      setHighlighted(preview.content.split('\n'))
    }
  }, [preview.content, prism, lang])

  const handleOpenInEditor = async () => {
    setOpenStatus('opening')
    try {
      const r = await fetch(`/api/open?path=${encodeURIComponent(node.path)}`)
      const d = await r.json()
      setOpenStatus(d.ok ? 'ok' : 'error')
      setTimeout(() => setOpenStatus('idle'), 2000)
    } catch {
      setOpenStatus('error')
      setTimeout(() => setOpenStatus('idle'), 3000)
    }
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Preview
      </div>
      {preview.loading && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(120,120,175,0.45)', padding: '6px 0' }}>loading…</div>
      )}
      {preview.error && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(200,80,80,0.6)' }}>{preview.error}</div>
      )}
      {preview.content != null && !preview.loading && (
        <>
          <div style={{
            background: '#0a0a12',
            border: '1px solid rgba(78,205,196,0.12)',
            borderRadius: 6, padding: '8px 0',
            maxHeight: 240, overflowY: 'auto', overflowX: 'auto',
          }}>
            {preview.content.split('\n').map((rawLine, i, arr) => {
              if (i === arr.length - 1 && rawLine === '') return null
              const htmlLine = highlighted[i] ?? rawLine
              return (
                <div key={i} style={{ display: 'flex', lineHeight: 1.6, minHeight: '1.6em' }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10,
                    color: 'rgba(120,120,175,0.3)', userSelect: 'none',
                    flexShrink: 0, width: 28, textAlign: 'right',
                    paddingRight: 10, fontVariantNumeric: 'tabular-nums',
                  }}>{i + 1}</span>
                  {prism && highlighted.length ? (
                    <span
                      className={`language-${lang}`}
                      style={{ fontFamily: MONO, fontSize: 10.5, whiteSpace: 'pre', flex: 1 }}
                      dangerouslySetInnerHTML={{ __html: htmlLine || ' ' }}
                    />
                  ) : (
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: 'rgba(200,210,240,0.75)', whiteSpace: 'pre' }}>
                      {rawLine || ' '}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {preview.truncated && (
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.4)', marginTop: 3, textAlign: 'right' }}>
              showing 20 of {preview.total} lines
            </div>
          )}
          <button
            onClick={handleOpenInEditor}
            style={{
              marginTop: 8, background: 'none', border: 'none', padding: 0,
              color: openStatus === 'ok' ? '#3dffa0' : openStatus === 'error' ? '#ff4466' : 'rgba(78,205,196,0.7)',
              fontFamily: MONO, fontSize: 11, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (openStatus === 'idle') e.currentTarget.style.color = '#4ecdc4' }}
            onMouseLeave={e => { if (openStatus === 'idle') e.currentTarget.style.color = 'rgba(78,205,196,0.7)' }}
          >
            {openStatus === 'opening' ? 'opening…' : openStatus === 'ok' ? '✓ opened' : openStatus === 'error' ? '✗ failed' : 'Open in editor →'}
          </button>
        </>
      )}
    </div>
  )
}

function GitDiffSection({ gitDiff }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Git Changes
      </div>
      {gitDiff.loading && <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(120,120,175,0.4)' }}>loading…</div>}
      {gitDiff.summary && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(200,200,230,0.6)', marginBottom: 6, lineHeight: 1.5 }}>{gitDiff.summary}</div>
      )}
      {gitDiff.diff && gitDiff.diff.length > 0 && (
        <div style={{
          background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(124,157,245,0.1)',
          borderRadius: 6, padding: '6px 10px', maxHeight: 140, overflowY: 'auto',
        }}>
          {gitDiff.diff.map((line, i) => {
            const isAdd  = line.startsWith('+') && !line.startsWith('+++')
            const isDel  = line.startsWith('-') && !line.startsWith('---')
            const isHunk = line.startsWith('@@')
            return (
              <div key={i} style={{
                fontFamily: MONO, fontSize: 9, lineHeight: 1.5,
                color: isAdd  ? 'rgba(78,205,196,0.8)'
                     : isDel  ? 'rgba(255,107,107,0.7)'
                     : isHunk ? 'rgba(124,157,245,0.6)'
                     :          'rgba(160,160,200,0.45)',
                whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
              }}>{line || ' '}</div>
            )
          })}
        </div>
      )}
      {gitDiff.error && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(200,80,80,0.6)' }}>{gitDiff.error}</div>
      )}
    </div>
  )
}

const OPEN_ACTIONS = [
  { action: 'editor',   label: 'Open in Cursor',  foldersOnly: false },
  { action: 'files',    label: 'Open in Dolphin', foldersOnly: true  },
  { action: 'terminal', label: 'Open in Konsole', foldersOnly: true  },
]

function openStatusLabel(status, defaultLabel) {
  if (!status || status === 'idle') return { text: defaultLabel, color: '#7c9df5' }
  if (status === 'opening') return { text: 'opening…',  color: '#6e6e9e' }
  if (status === 'ok')      return { text: '✓ opened',  color: '#3dffa0' }
  return                           { text: '✗ failed',  color: '#ff4466' }
}

// ── Activity section helpers ─────────────────────────────────────────────────

/**
 * Build a display object for the activity section.
 * Export allows direct testing without rendering.
 */
export function buildActivityDisplay(activityItem) {
  if (!activityItem) return { available: false }
  return {
    available:         true,
    summary:           summarizeActivity(activityItem),
    level:             getActivityLevel(activityItem),
    lastCommitAt:      activityItem.lastCommitAt,
    lastCommitSha:     activityItem.lastCommitSha,
    lastCommitMessage: activityItem.lastCommitMessage,
    author:            activityItem.author,
    commitCount7d:     activityItem.commitCount7d  ?? 0,
    commitCount30d:    activityItem.commitCount30d ?? 0,
    isDirty:           Boolean(activityItem.isDirty),
  }
}

function formatAgeDays(isoString) {
  if (!isoString) return null
  const ageDays = (Date.now() - new Date(isoString).getTime()) / 86400000
  if (ageDays < 0.042) return 'just now'
  if (ageDays < 1)     return `${Math.round(ageDays * 24)}h ago`
  if (ageDays < 7)     return `${Math.floor(ageDays)}d ago`
  if (ageDays < 30)    return `${Math.floor(ageDays / 7)}w ago`
  return `${Math.floor(ageDays / 30)}mo ago`
}

const LEVEL_COLORS = {
  hot:   '#ff6b35',
  warm:  '#c8a020',
  cool:  '#4a9090',
  stale: '#555570',
}

function ActivityStrip({ display }) {
  const { commitCount7d, commitCount30d, level, isDirty } = display
  const buckets = [
    { label: '30d', value: commitCount30d, color: '#4a80cc' },
    { label: '7d',  value: commitCount7d,  color: '#4ecdc4' },
    { label: 'hot', value: level === 'hot'  ? 1 : 0, color: '#ff6b35' },
    { label: 'dirty', value: isDirty ? 1 : 0, color: '#e8a020' },
  ]
  const max = Math.max(...buckets.map(b => b.value), 1)
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
      {buckets.map(b => (
        <div key={b.label} style={{ flex: 1 }}>
          <div style={{
            height: 24, background: 'rgba(0,0,0,0.35)',
            borderRadius: 3, overflow: 'hidden', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: `${(b.value / max) * 100}%`,
              background: b.color + '88',
              transition: 'height 0.4s ease',
            }} />
          </div>
          <div style={{
            fontFamily: MONO, fontSize: 8,
            color: 'rgba(120,120,175,0.5)',
            textAlign: 'center', marginTop: 2,
          }}>{b.label}</div>
        </div>
      ))}
    </div>
  )
}

function ActivityMetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 3, lineHeight: 1.4 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,110,158,0.55)', minWidth: 66, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontFamily: MONO, fontSize: 9, color: 'rgba(190,195,230,0.75)',
        wordBreak: 'break-all', overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {String(value)}
      </span>
    </div>
  )
}

function ActivitySection({ activityItem, activityMode }) {
  if (!activityMode) return null
  const display = buildActivityDisplay(activityItem)

  const levelColor = display.level ? (LEVEL_COLORS[display.level] ?? '#888') : '#888'
  const summaryBg  = display.level ? `${levelColor}22` : 'rgba(80,80,120,0.12)'

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: MONO, fontSize: 9,
        color: 'rgba(120,120,175,0.55)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Activity
      </div>

      {!display.available ? (
        <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(120,120,175,0.4)' }}>
          No git activity available
        </span>
      ) : (
        <>
          {/* Summary chip */}
          <div style={{
            display: 'inline-block',
            fontFamily: MONO, fontSize: 10,
            color: levelColor,
            background: summaryBg,
            border: `1px solid ${levelColor}44`,
            borderRadius: 4, padding: '2px 7px', marginBottom: 10,
          }}>
            {display.summary}
          </div>

          {/* Commit metadata */}
          {display.lastCommitAt && (
            <div>
              <ActivityMetaRow label="last commit"  value={formatAgeDays(display.lastCommitAt)} />
              {display.author            && <ActivityMetaRow label="author"      value={display.author} />}
              {display.lastCommitSha     && <ActivityMetaRow label="sha"         value={display.lastCommitSha} />}
              {display.lastCommitMessage && <ActivityMetaRow label="message"     value={display.lastCommitMessage} />}
              <ActivityMetaRow label="7d commits"  value={display.commitCount7d} />
              <ActivityMetaRow label="30d commits" value={display.commitCount30d} />
              {display.isDirty && <ActivityMetaRow label="status" value="dirty — unstaged changes" />}
            </div>
          )}

          <ActivityStrip display={display} />
        </>
      )}
    </div>
  )
}

export default function Panel({
  node,
  onClose,
  isPinned,
  onPin,
  onUnpin,
  onDrillIn,
  onRescan,
  onExport,
  depth = 0,
  rootPath,
  activityMode = false,
  activityItem = null,
}) {
  const [mounted, setMounted]     = useState(false)
  const [openStatus, setOpenStatus] = useState({})
  const [hoverBtn, setHoverBtn]   = useState(null)
  const [copiedPath, setCopiedPath] = useState(false)

  const gitDiff      = useGitDiff(node)
  const activeSignals = getActiveSignals(node)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 16)
    return () => clearTimeout(t)
  }, [])

  const relPath = (() => {
    if (!node.path) return ''
    if (!rootPath) {
      return node.path.length > 52 ? '…' + node.path.slice(-52) : node.path
    }
    const rel = node.path.startsWith(rootPath)
      ? node.path.slice(rootPath.length).replace(/^\//, '')
      : node.path
    return rel || node.name
  })()

  const handleOpenApp = async (action) => {
    setOpenStatus(prev => ({ ...prev, [action]: 'opening' }))
    try {
      const result = await openNode(node.path, action)
      if (result.ok) {
        setOpenStatus(prev => ({ ...prev, [action]: 'ok' }))
        setTimeout(() => setOpenStatus(prev => ({ ...prev, [action]: 'idle' })), 2000)
      } else throw new Error(result.error ?? 'failed')
    } catch {
      setOpenStatus(prev => ({ ...prev, [action]: 'error' }))
      setTimeout(() => setOpenStatus(prev => ({ ...prev, [action]: 'idle' })), 3000)
    }
  }

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path).then(() => {
      setCopiedPath(true)
      setTimeout(() => setCopiedPath(false), 1500)
    }).catch(() => {})
  }

  const typeColor  = node.type === 'folder' ? '#c8a2ff' : '#4ecdc4'
  const typeBadge  = buildTypeBadge(node)
  const metrics    = buildMetrics(node, activeSignals, depth)
  const actionBtns = buildActions(node, { onDrillIn, onRescan, onExport })

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0,
      width: 320,
      background: '#0f0f14',
      borderLeft: '1px solid rgba(78,205,196,0.15)',
      zIndex: 500,
      overflowY: 'auto',
      padding: '20px 16px 32px',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      fontFamily: SANS,
      transform: mounted ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 240ms cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* ── SECTION 1: NODE HEADER ─────────────────────── */}
      <div style={{ paddingRight: 56, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
          <span style={{
            fontSize: 18, fontWeight: 700, color: '#f0f0f8',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
          }}>
            {node.name}
          </span>
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            background: typeColor + '22', color: typeColor,
            border: `1px solid ${typeColor}44`,
            borderRadius: 4, padding: '1px 6px', flexShrink: 0,
          }}>{typeBadge}</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(120,120,175,0.55)', wordBreak: 'break-all', lineHeight: 1.5 }}>
          {relPath}
        </div>
      </div>

      {/* Pin + Close absolute buttons */}
      {onPin && (
        <button
          onClick={isPinned ? onUnpin : onPin}
          title={isPinned ? 'Unpin' : 'Pin'}
          style={{
            position: 'absolute', top: 16, right: 42,
            background: 'none', border: 'none',
            color: isPinned ? '#ffd93d' : 'rgba(110,110,158,0.35)',
            cursor: 'pointer', fontSize: 13, lineHeight: 1,
            transition: 'color 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >{isPinned ? '★' : '☆'}</button>
      )}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'none', border: 'none',
          color: 'rgba(120,120,175,0.45)', fontSize: 18,
          cursor: 'pointer', lineHeight: 1, padding: '0 2px',
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#e2e2f2'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(120,120,175,0.45)'}
      >×</button>

      <div style={{ height: 1, background: 'rgba(124,157,245,0.08)', margin: '0 0 14px' }} />

      {/* ── SECTION 2: METRICS ROW ──────────────────────── */}
      {metrics.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {metrics.map(m => <MetricChip key={m.label} icon={m.icon} value={m.value} label={m.label} />)}
        </div>
      )}

      {/* ── SECTION 3: SIGNAL LIST ──────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        {activeSignals.length === 0 ? (
          <span style={{ fontFamily: MONO, fontSize: 11, color: '#3dffa0' }}>✓ Clean</span>
        ) : (
          <>
            <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Active Signals
            </div>
            {activeSignals.map(key => <SignalRow key={key} signalKey={key} />)}
          </>
        )}
      </div>

      {/* ── SECTION 4: FILE PREVIEW ─────────────────────── */}
      {node.type === 'file' && <FilePreviewSection node={node} />}

      {/* Git diff (retained — useful for nodes with git signals) */}
      {(activeSignals.includes('gitDirty') || activeSignals.includes('gitUnpushed')) && (
        <GitDiffSection gitDiff={gitDiff} />
      )}

      {/* ── SECTION 4b: ACTIVITY ────────────────────────── */}
      {activityMode && (
        <>
          <div style={{ height: 1, background: 'rgba(124,157,245,0.08)', margin: '16px 0 12px' }} />
          <ActivitySection activityItem={activityItem} activityMode={activityMode} />
        </>
      )}

      <div style={{ height: 1, background: 'rgba(124,157,245,0.08)', margin: '16px 0 12px' }} />

      {/* ── SECTION 5: ACTIONS ROW ──────────────────────── */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(120,120,175,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Actions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {actionBtns.map(({ key, icon, label, onClick }) => (
            <button
              key={key}
              onClick={key === 'copy' ? handleCopyPath : onClick}
              style={{
                fontFamily: MONO, fontSize: 11,
                padding: '5px 10px', borderRadius: 6,
                background: hoverBtn === key ? 'rgba(78,205,196,0.12)' : 'rgba(78,205,196,0.05)',
                border: `1px solid ${hoverBtn === key ? 'rgba(78,205,196,0.4)' : 'rgba(78,205,196,0.18)'}`,
                color: key === 'copy' && copiedPath ? '#3dffa0' : hoverBtn === key ? '#4ecdc4' : 'rgba(120,120,175,0.8)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={() => setHoverBtn(key)}
              onMouseLeave={() => setHoverBtn(null)}
            >
              <span style={{ fontSize: 12 }}>{icon}</span>
              <span>{key === 'copy' && copiedPath ? 'Copied!' : label}</span>
            </button>
          ))}
          {OPEN_ACTIONS
            .filter(({ foldersOnly }) => !foldersOnly || node.type === 'folder')
            .map(({ action, label }) => {
              const st  = openStatusLabel(openStatus[action], label)
              const key = `open-${action}`
              return (
                <button
                  key={key}
                  onClick={() => handleOpenApp(action)}
                  style={{
                    fontFamily: MONO, fontSize: 11,
                    padding: '5px 10px', borderRadius: 6,
                    background: hoverBtn === key ? 'rgba(124,157,245,0.12)' : 'rgba(124,157,245,0.05)',
                    border: `1px solid ${hoverBtn === key ? 'rgba(124,157,245,0.4)' : 'rgba(124,157,245,0.18)'}`,
                    color: hoverBtn === key ? '#e2e2f2' : st.color,
                    cursor: 'pointer',
                    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
                  }}
                  onMouseEnter={() => setHoverBtn(key)}
                  onMouseLeave={() => setHoverBtn(null)}
                >{st.text}</button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
