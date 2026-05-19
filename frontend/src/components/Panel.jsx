import { useState, useEffect } from 'react'
import { getActiveSignals, SIGNAL_COLORS, SIGNAL_LABELS } from '../utils/signals'
import { getNodeColor } from '../utils/palette'
import { openNode } from '../utils/loadTree'
import { useGitDiff } from '../hooks/useGitDiff'
import { summarizeActivity } from '../utils/loadActivity'
import { getActivityLevel } from '../utils/activityAggregate'
import { classifyNode, CLUSTERS } from '../utils/archClassify'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SANS = "'Outfit', 'Inter', system-ui, sans-serif"

function getPanelColors(colorTheme) {
  const l = colorTheme === 'light'
  return {
    bg:             l ? 'rgba(240,245,252,0.92)' : '#0f0f14',
    border:         l ? 'rgba(0,100,140,0.15)'   : 'rgba(78,205,196,0.15)',
    shadow:         l ? '-6px 0 20px rgba(0,60,100,0.1)' : '-8px 0 32px rgba(0,0,0,0.4)',
    textPrimary:    l ? '#1a2a3a'                : '#f0f0f8',
    textMuted:      l ? 'rgba(30,60,100,0.55)'  : 'rgba(120,120,175,0.55)',
    textLabel:      l ? 'rgba(30,60,100,0.45)'  : 'rgba(120,120,175,0.55)',
    sep:            l ? 'rgba(0,100,140,0.08)'  : 'rgba(124,157,245,0.08)',
    chipBg:         l ? 'rgba(0,100,140,0.06)'  : 'rgba(0,0,0,0.3)',
    chipBorder:     l ? 'rgba(0,100,140,0.14)'  : 'rgba(78,205,196,0.18)',
    chipText:       l ? '#1a2a3a'                : '#e2e2f2',
    chipLabel:      l ? 'rgba(30,60,100,0.5)'   : 'rgba(120,120,175,0.6)',
    signalHover:    l ? 'rgba(0,100,140,0.06)'  : 'rgba(78,205,196,0.06)',
    previewBg:      l ? 'rgba(240,245,252,0.7)' : '#0a0a12',
    previewBorder:  l ? 'rgba(0,100,140,0.12)'  : 'rgba(78,205,196,0.12)',
    previewText:    l ? 'rgba(30,60,100,0.8)'   : 'rgba(200,210,240,0.75)',
    previewLineNum: l ? 'rgba(30,60,100,0.3)'   : 'rgba(120,120,175,0.3)',
    diffBg:         l ? 'rgba(0,100,140,0.04)'  : 'rgba(0,0,0,0.35)',
    diffBorder:     l ? 'rgba(0,100,140,0.08)'  : 'rgba(124,157,245,0.1)',
    diffNeutral:    l ? 'rgba(30,60,100,0.5)'   : 'rgba(160,160,200,0.45)',
    actionBg:       l ? 'rgba(0,100,140,0.04)'  : 'rgba(78,205,196,0.05)',
    actionBgHov:    l ? 'rgba(0,100,140,0.09)'  : 'rgba(78,205,196,0.12)',
    actionBorder:   l ? 'rgba(0,100,140,0.14)'  : 'rgba(78,205,196,0.18)',
    actionBorderHov:l ? 'rgba(0,100,140,0.35)'  : 'rgba(78,205,196,0.4)',
    actionColor:    l ? 'rgba(30,60,100,0.6)'   : 'rgba(120,120,175,0.8)',
    actionColorHov: l ? '#006080'               : '#4ecdc4',
    altBg:          l ? 'rgba(0,100,140,0.04)'  : 'rgba(124,157,245,0.05)',
    altBgHov:       l ? 'rgba(0,100,140,0.08)'  : 'rgba(124,157,245,0.12)',
    altBorder:      l ? 'rgba(0,100,140,0.12)'  : 'rgba(124,157,245,0.18)',
    altBorderHov:   l ? 'rgba(0,100,140,0.3)'   : 'rgba(124,157,245,0.4)',
    clean:          l ? '#006040'               : '#3dffa0',
    openBtn:        l ? 'rgba(0,100,140,0.7)'   : 'rgba(78,205,196,0.7)',
    actLabel:       l ? 'rgba(30,60,100,0.45)'  : 'rgba(110,110,158,0.55)',
    actValue:       l ? 'rgba(30,60,100,0.8)'   : 'rgba(190,195,230,0.75)',
  }
}

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

export function buildActions(node, { onDrillIn, onRescan, onExport, rootPath } = {}) {
  return [
    node.type === 'folder' && onDrillIn && { key: 'drill',    icon: '⟫', label: 'Drill in',        onClick: () => onDrillIn(node) },
    onRescan                             && { key: 'rescan',   icon: '↻', label: 'Rescan',           onClick: onRescan },
                                            { key: 'copy',     icon: '⧉', label: 'Copy path',       onClick: null },
    rootPath                             && { key: 'copyRel',  icon: '⧉', label: 'Copy rel path',   onClick: null },
    onExport                             && { key: 'export',   icon: '↓', label: 'Export',           onClick: onExport },
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

function MetricChip({ icon, value, label, pc }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: pc.chipBg, border: `1px solid ${pc.chipBorder}`,
      borderRadius: 8, padding: '6px 10px', minWidth: 52, gap: 2,
    }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: pc.chipText, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontFamily: MONO, fontSize: 9, color: pc.chipLabel, letterSpacing: '0.04em' }}>{label}</span>
    </div>
  )
}

const SIGNAL_HUMAN = {
  ...SIGNAL_LABELS,
  largefile: 'Large file',
  todoDensity: 'High TODO density',
  deepNesting: 'Deep nesting',
}

function SignalRow({ signalKey, pc }) {
  const [hov, setHov] = useState(false)
  const color = SIGNAL_COLORS[signalKey] ?? '#888'
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 6px', borderRadius: 6, marginBottom: 1,
        background: hov ? pc.signalHover : 'transparent',
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

function FilePreviewSection({ node, pc }) {
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
            background: pc.previewBg,
            border: `1px solid ${pc.previewBorder}`,
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
                    color: pc.previewLineNum, userSelect: 'none',
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
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: pc.previewText, whiteSpace: 'pre' }}>
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
              color: openStatus === 'ok' ? '#3dffa0' : openStatus === 'error' ? '#ff4466' : pc.openBtn,
              fontFamily: MONO, fontSize: 11, cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { if (openStatus === 'idle') e.currentTarget.style.color = pc.actionColorHov }}
            onMouseLeave={e => { if (openStatus === 'idle') e.currentTarget.style.color = pc.openBtn }}
          >
            {openStatus === 'opening' ? 'opening…' : openStatus === 'ok' ? '✓ opened' : openStatus === 'error' ? '✗ failed' : 'Open in editor →'}
          </button>
        </>
      )}
    </div>
  )
}

function GitDiffSection({ gitDiff, pc }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: pc.textLabel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Git Changes
      </div>
      {gitDiff.loading && <div style={{ fontFamily: MONO, fontSize: 10, color: pc.textMuted }}>loading…</div>}
      {gitDiff.summary && (
        <div style={{ fontFamily: MONO, fontSize: 10, color: pc.actValue, marginBottom: 6, lineHeight: 1.5 }}>{gitDiff.summary}</div>
      )}
      {gitDiff.diff && gitDiff.diff.length > 0 && (
        <div style={{
          background: pc.diffBg, border: `1px solid ${pc.diffBorder}`,
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
                     :          pc.diffNeutral,
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
  { action: 'editor',      label: 'Open in Cursor',   foldersOnly: false, filesOnly: false },
  { action: 'reveal',      label: 'Reveal in files',  foldersOnly: false, filesOnly: true  },
  { action: 'open-parent', label: 'Open parent',      foldersOnly: true,  filesOnly: false },
  { action: 'files',       label: 'Open in Dolphin',  foldersOnly: true,  filesOnly: false },
  { action: 'terminal',    label: 'Open in Konsole',  foldersOnly: true,  filesOnly: false },
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

function ActivityMetaRow({ label, value, pc }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 3, lineHeight: 1.4 }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: pc.actLabel, minWidth: 66, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontFamily: MONO, fontSize: 9, color: pc.actValue,
        wordBreak: 'break-all', overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {String(value)}
      </span>
    </div>
  )
}

const LEVEL_DISPLAY = {
  hot:   { label: 'Active today',      color: '#ff6b35' },
  warm:  { label: 'Active this week',  color: '#c8a020' },
  cool:  { label: 'Active this month', color: '#4a9090' },
  stale: { label: 'Quiet',             color: null },
}

function ActivitySection({ activityItem, activityMode, pc }) {
  if (!activityMode) return null
  const display = buildActivityDisplay(activityItem)

  if (!display.available) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color: pc.textLabel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
          Activity
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: pc.textMuted }}>No git data</div>
      </div>
    )
  }

  const lvlCfg = LEVEL_DISPLAY[display.level ?? 'stale'] ?? LEVEL_DISPLAY.stale
  const labelColor = lvlCfg.color ?? pc.textMuted

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: MONO, fontSize: 9, color: pc.textLabel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        Activity
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 600,
          color: labelColor,
          background: lvlCfg.color ? lvlCfg.color + '18' : pc.chipBg,
          border: `1px solid ${lvlCfg.color ? lvlCfg.color + '40' : pc.sep}`,
          borderRadius: 4, padding: '2px 8px',
        }}>
          {lvlCfg.label}
        </span>
        {display.isDirty && (
          <span style={{
            fontFamily: MONO, fontSize: 10, fontWeight: 600,
            color: '#e8a020',
            background: '#e8a02018', border: '1px solid #e8a02040',
            borderRadius: 4, padding: '2px 7px',
          }}>
            dirty
          </span>
        )}
      </div>

      {/* Recency + commit counts on one line */}
      <div style={{ display: 'flex', gap: 18, marginBottom: display.lastCommitMessage ? 8 : 0, flexWrap: 'wrap' }}>
        {display.lastCommitAt && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: pc.actLabel, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>last commit</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: pc.actValue }}>{formatAgeDays(display.lastCommitAt)}</div>
          </div>
        )}
        {(display.commitCount7d > 0 || display.commitCount30d > 0) && (
          <div>
            <div style={{ fontFamily: MONO, fontSize: 8, color: pc.actLabel, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>commits</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: pc.actValue }}>
              {display.commitCount7d}w · {display.commitCount30d}mo
            </div>
          </div>
        )}
      </div>

      {/* Last commit message — most useful quick context */}
      {display.lastCommitMessage && (
        <div style={{
          fontFamily: MONO, fontSize: 9.5, color: pc.actValue,
          lineHeight: 1.45, marginTop: 4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {display.lastCommitMessage}
        </div>
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
  colorTheme = 'dark',
  archMode = false,
}) {
  const pc = getPanelColors(colorTheme)
  const [mounted, setMounted]       = useState(false)
  const [openStatus, setOpenStatus] = useState({})
  const [hoverBtn, setHoverBtn]     = useState(null)
  const [copiedPath, setCopiedPath]       = useState(false)
  const [copiedRelPath, setCopiedRelPath] = useState(false)

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
    const isParent = action === 'open-parent'
    const targetPath = isParent
      ? (node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/')) || '/' : '/')
      : node.path
    const backendAction = isParent ? 'files' : action

    setOpenStatus(prev => ({ ...prev, [action]: 'opening' }))
    try {
      const result = await openNode(targetPath, backendAction)
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

  const handleCopyRelPath = () => {
    const rel = rootPath && node.path.startsWith(rootPath)
      ? node.path.slice(rootPath.length).replace(/^\//, '') || node.name
      : node.path
    navigator.clipboard.writeText(rel).then(() => {
      setCopiedRelPath(true)
      setTimeout(() => setCopiedRelPath(false), 1500)
    }).catch(() => {})
  }

  const typeColor  = node.type === 'folder' ? '#c8a2ff' : '#4ecdc4'
  const typeBadge  = buildTypeBadge(node)
  const metrics    = buildMetrics(node, activeSignals, depth)
  const actionBtns = buildActions(node, { onDrillIn, onRescan, onExport, rootPath })

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0,
      width: 320,
      background: pc.bg,
      borderLeft: `1px solid ${pc.border}`,
      zIndex: 500,
      display: 'flex', flexDirection: 'column',
      boxShadow: pc.shadow,
      fontFamily: SANS,
      transform: mounted ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 240ms cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* ── STICKY HEADER ─────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        padding: '16px 16px 12px',
        borderBottom: `1px solid ${pc.sep}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{
                fontSize: 17, fontWeight: 700, color: pc.textPrimary,
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
            <div style={{ fontFamily: MONO, fontSize: 11, color: pc.textMuted, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {relPath}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {onPin && (
              <button
                onClick={isPinned ? onUnpin : onPin}
                title={isPinned ? 'Unpin' : 'Pin'}
                style={{
                  background: 'none', border: 'none',
                  color: isPinned ? '#ffd93d' : pc.textMuted,
                  cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '2px 4px',
                  transition: 'color 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >{isPinned ? '★' : '☆'}</button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                color: pc.textMuted, fontSize: 18,
                cursor: 'pointer', lineHeight: 1, padding: '0 4px',
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = pc.textPrimary}
              onMouseLeave={e => e.currentTarget.style.color = pc.textMuted}
            >×</button>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ───────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 32px' }}>

      {/* ── SECTION 1: ACTION STRIP ─────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
        {actionBtns.map(({ key, icon, label, onClick }) => (
          <button
            key={key}
            onClick={key === 'copy' ? handleCopyPath : key === 'copyRel' ? handleCopyRelPath : onClick}
            style={{
              fontFamily: MONO, fontSize: 10,
              padding: '4px 9px', borderRadius: 5,
              background: hoverBtn === key ? pc.actionBgHov : pc.actionBg,
              border: `1px solid ${hoverBtn === key ? pc.actionBorderHov : pc.actionBorder}`,
              color: (key === 'copy' && copiedPath) || (key === 'copyRel' && copiedRelPath)
                ? pc.clean : hoverBtn === key ? pc.actionColorHov : pc.actionColor,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              transition: 'background 0.12s, border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={() => setHoverBtn(key)}
            onMouseLeave={() => setHoverBtn(null)}
          >
            <span>{key === 'copy' && copiedPath ? 'Copied!' : key === 'copyRel' && copiedRelPath ? 'Copied!' : label}</span>
          </button>
        ))}
        {OPEN_ACTIONS
          .filter(({ foldersOnly, filesOnly }) =>
            (!foldersOnly || node.type === 'folder') &&
            (!filesOnly   || node.type === 'file')
          )
          .map(({ action, label }) => {
            const st  = openStatusLabel(openStatus[action], label)
            const key = `open-${action}`
            return (
              <button
                key={key}
                onClick={() => handleOpenApp(action)}
                style={{
                  fontFamily: MONO, fontSize: 10,
                  padding: '4px 9px', borderRadius: 5,
                  background: hoverBtn === key ? pc.altBgHov : pc.altBg,
                  border: `1px solid ${hoverBtn === key ? pc.altBorderHov : pc.altBorder}`,
                  color: hoverBtn === key ? pc.textPrimary : st.color,
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s, color 0.12s',
                }}
                onMouseEnter={() => setHoverBtn(key)}
                onMouseLeave={() => setHoverBtn(null)}
              >{st.text}</button>
            )
          })}
      </div>

      {/* ── SECTION 2: METRICS ROW ──────────────────────── */}
      {metrics.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {metrics.map(m => <MetricChip key={m.label} icon={m.icon} value={m.value} label={m.label} pc={pc} />)}
        </div>
      )}

      {/* ── SECTION 2b: ARCH CLUSTER ───────────────────── */}
      {archMode && (() => {
        const arch = classifyNode(node)
        const cl   = CLUSTERS[arch.cluster] ?? CLUSTERS.other
        return (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, color: pc.textLabel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              Architecture
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 600,
                color: cl.color,
                background: cl.color + '20',
                border: `1px solid ${cl.color}44`,
                borderRadius: 4, padding: '2px 8px',
              }}>{cl.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: pc.textMuted }}>
                {arch.reason}
              </span>
            </div>
          </div>
        )
      })()}

      {/* ── SECTION 3: SIGNAL LIST ──────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        {activeSignals.length === 0 ? (
          <span style={{ fontFamily: MONO, fontSize: 11, color: pc.clean }}>✓ Clean</span>
        ) : (
          <>
            <div style={{ fontFamily: MONO, fontSize: 9, color: pc.textLabel, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Active Signals
            </div>
            {activeSignals.map(key => <SignalRow key={key} signalKey={key} pc={pc} />)}
          </>
        )}
      </div>

      {/* ── SECTION 4: FILE PREVIEW ─────────────────────── */}
      {node.type === 'file' && <FilePreviewSection node={node} pc={pc} />}

      {/* Git diff (retained — useful for nodes with git signals) */}
      {(activeSignals.includes('gitDirty') || activeSignals.includes('gitUnpushed')) && (
        <GitDiffSection gitDiff={gitDiff} pc={pc} />
      )}

      {/* ── SECTION 4b: ACTIVITY ────────────────────────── */}
      {activityMode && (
        <>
          <div style={{ height: 1, background: pc.sep, margin: '16px 0 12px' }} />
          <ActivitySection activityItem={activityItem} activityMode={activityMode} pc={pc} />
        </>
      )}


      </div> {/* end scrollable body */}
    </div>
  )
}
