import { useState, useEffect, useRef, useMemo } from 'react'
import { fuzzySearch } from '../utils/fuzzySearch.js'
import { getActiveSignals, SIGNAL_COLORS } from '../utils/signals.js'
import { getActivityLevel } from '../utils/activityAggregate.js'
import { openNode } from '../utils/loadTree.js'
import { classifyNode, CLUSTERS } from '../utils/archClassify.js'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SANS = "'Outfit', 'Inter', system-ui, sans-serif"

function getSearchColors(colorTheme) {
  const l = colorTheme === 'light'
  return {
    overlay:        l ? 'rgba(180,200,220,0.35)' : 'rgba(3,6,12,0.52)',
    dialogBg:       l ? 'rgba(240,245,252,0.97)' : '#151823',
    dialogBorder:   l ? 'rgba(0,100,140,0.14)'   : 'rgba(110,231,220,0.12)',
    dialogShadow:   l ? '0 24px 80px rgba(0,60,100,0.15)' : '0 24px 80px rgba(0,0,0,0.55)',
    divider:        l ? 'rgba(0,100,140,0.08)'   : 'rgba(110,231,220,0.07)',
    inputText:      l ? '#1a2a3a'                : 'rgba(230,238,255,0.95)',
    inputCaret:     l ? '#006080'               : '#4ecdc4',
    inputBtnColor:  l ? 'rgba(30,60,100,0.4)'   : 'rgba(220,230,245,0.35)',
    inputBtnHov:    l ? 'rgba(30,60,100,0.9)'   : 'rgba(220,230,245,0.8)',
    chipActiveBg:   l ? 'rgba(0,100,140,0.12)'  : 'rgba(78,205,196,0.14)',
    chipActiveBorder:l? 'rgba(0,100,140,0.5)'   : 'rgba(78,205,196,0.55)',
    chipActiveText: l ? '#006080'               : '#6ee7dc',
    chipIdleBg:     l ? 'rgba(0,100,140,0.03)'  : 'rgba(255,255,255,0.03)',
    chipIdleBorder: l ? 'rgba(0,100,140,0.14)'  : 'rgba(110,231,220,0.14)',
    chipIdleText:   l ? 'rgba(30,60,100,0.55)'  : 'rgba(220,230,245,0.55)',
    rowActiveBg:    l ? 'rgba(0,100,140,0.09)'  : 'rgba(110,231,220,0.12)',
    rowActiveBorder:l ? 'rgba(0,100,140,0.5)'   : 'rgba(78,205,196,0.7)',
    rowNameActive:  l ? '#1a2a3a'               : '#f0f4ff',
    rowNameIdle:    l ? 'rgba(30,60,100,0.8)'   : 'rgba(220,230,245,0.9)',
    rowPath:        l ? 'rgba(30,60,100,0.5)'   : 'rgba(220,230,245,0.45)',
    rowMatch:       l ? 'rgba(0,100,140,0.5)'   : 'rgba(110,231,220,0.4)',
    emptyText:      l ? 'rgba(30,60,100,0.5)'   : 'rgba(220,230,245,0.35)',
    hintText:       l ? 'rgba(30,60,100,0.3)'   : 'rgba(220,230,245,0.25)',
  }
}

const ACT_COLORS = { hot: '#ff6b35', warm: '#c8a020', cool: '#4a9090' }
const ACT_LABELS = { hot: 'today', warm: 'this week', cool: 'this month' }

const CHIPS = [
  { id: 'all',     label: 'All',     typeFilter: null,     signalFilter: null      },
  { id: 'folders', label: 'Folders', typeFilter: 'folder', signalFilter: null      },
  { id: 'files',   label: 'Files',   typeFilter: 'file',   signalFilter: null      },
  { id: 'signals', label: 'Signals', typeFilter: null,     signalFilter: 'signals' },
  { id: 'git',     label: 'Git',     typeFilter: null,     signalFilter: 'git'     },
  { id: 'todo',    label: 'TODO',    typeFilter: null,     signalFilter: 'todo'    },
  { id: 'large',   label: 'Large',   typeFilter: null,     signalFilter: 'large'   },
  { id: 'deep',    label: 'Deep',    typeFilter: null,     signalFilter: 'deep'    },
]

function relPath(nodePath, rootPath) {
  if (!rootPath || !nodePath) return nodePath ?? ''
  if (nodePath.startsWith(rootPath)) {
    return nodePath.slice(rootPath.length).replace(/^\//, '') || nodePath
  }
  return nodePath
}

function TypeBadge({ type }) {
  const color = type === 'folder' ? '#c8a2ff' : '#4ecdc4'
  return (
    <span style={{
      fontFamily: MONO, fontSize: 9, fontWeight: 600,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color, background: color + '22',
      border: `1px solid ${color}33`,
      borderRadius: 3, padding: '1px 5px', flexShrink: 0,
    }}>
      {type === 'folder' ? 'dir' : 'file'}
    </span>
  )
}

function SignalDots({ node }) {
  const signals = getActiveSignals(node)
  if (!signals.length) return null
  return (
    <span style={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
      {signals.slice(0, 4).map(k => (
        <span key={k} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: SIGNAL_COLORS[k] ?? '#888',
          display: 'inline-block', flexShrink: 0,
        }} />
      ))}
    </span>
  )
}

function ResultRow({ result, isActive, rootPath, onMouseEnter, onClick, onQuickOpen, sc, activityLevel, archCluster = null }) {
  const { node, matchReason } = result
  const path = relPath(node.path, rootPath)
  const displayPath = path.length > 60 ? '…' + path.slice(-60) : path
  const actColor = activityLevel ? ACT_COLORS[activityLevel] : null

  return (
    <div
      role="option"
      aria-selected={isActive}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        padding: '9px 16px',
        cursor: 'pointer',
        background: isActive ? sc.rowActiveBg : 'transparent',
        borderLeft: isActive ? `2px solid ${sc.rowActiveBorder}` : '2px solid transparent',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        transition: 'background 0.08s',
        boxShadow: 'none',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0, opacity: 0.7 }}>
        {node.type === 'folder' ? '📁' : '📄'}
      </span>

      {/* Name + path */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: SANS, fontSize: 13, fontWeight: 600,
            color: isActive ? sc.rowNameActive : sc.rowNameIdle,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {node.name}
          </span>
          <TypeBadge type={node.type} />
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 10,
          color: sc.rowPath,
          marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {displayPath}
        </div>
      </div>

      {/* Right side: open button (active row) + signal dots + activity badge + match reason */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        {isActive && (
          <button
            onClick={e => { e.stopPropagation(); onQuickOpen?.(node.path) }}
            title="Open in Cursor"
            style={{
              fontFamily: MONO, fontSize: 9,
              padding: '2px 6px', borderRadius: 4,
              background: 'rgba(124,157,245,0.10)',
              border: '1px solid rgba(124,157,245,0.25)',
              color: 'rgba(124,157,245,0.75)',
              cursor: 'pointer', lineHeight: 1.4,
              transition: 'border-color 0.1s, color 0.1s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7c9df5'; e.currentTarget.style.borderColor = 'rgba(124,157,245,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(124,157,245,0.75)'; e.currentTarget.style.borderColor = 'rgba(124,157,245,0.25)' }}
          >
            open ⬡
          </button>
        )}
        <SignalDots node={node} />
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {actColor && (
            <span style={{
              fontFamily: MONO, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.04em',
              color: actColor,
              background: actColor + '20',
              border: `1px solid ${actColor}44`,
              borderRadius: 3, padding: '1px 4px', flexShrink: 0,
            }}>
              {ACT_LABELS[activityLevel]}
            </span>
          )}
          {archCluster && (() => {
            const cl = CLUSTERS[archCluster]
            return cl ? (
              <span style={{
                fontFamily: MONO, fontSize: 8, fontWeight: 600,
                color: cl.color,
                background: cl.color + '20',
                border: `1px solid ${cl.color}44`,
                borderRadius: 3, padding: '1px 4px', flexShrink: 0,
                letterSpacing: '0.03em',
              }}>
                {cl.label}
              </span>
            ) : null
          })()}
          {matchReason && (
            <span style={{ fontFamily: MONO, fontSize: 9, color: sc.rowMatch, whiteSpace: 'nowrap' }}>
              {matchReason}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPanel({
  open,
  nodes,
  currentRoot,
  onClose,
  onSelectNode,
  onDrillToNode,
  colorTheme = 'dark',
  activityIndex = null,
  archMode = false,
}) {
  const [query, setQuery]           = useState('')
  const [activeChip, setActiveChip] = useState('all')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef  = useRef()
  const listRef   = useRef()
  const activeRowRef = useRef()

  const chip = CHIPS.find(c => c.id === activeChip) ?? CHIPS[0]

  const results = useMemo(() =>
    fuzzySearch(nodes ?? [], query, {
      typeFilter:   chip.typeFilter,
      signalFilter: chip.signalFilter,
    }, activityIndex),
  [nodes, query, chip.typeFilter, chip.signalFilter, activityIndex])

  // Reset selection when results change
  useEffect(() => { setSelectedIdx(0) }, [results])

  // Autofocus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setActiveChip('all')
      setSelectedIdx(0)
    }
  }, [open])

  // Scroll active row into view
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  // Keyboard handler
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, results.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        const idx = CHIPS.findIndex(c => c.id === activeChip)
        setActiveChip(CHIPS[(idx + 1) % CHIPS.length].id)
        return
      }

      if (e.key === 'Enter') {
        const result = results[selectedIdx]
        if (!result) return
        e.preventDefault()
        if (e.metaKey || e.ctrlKey) {
          if (result.node.type === 'folder') {
            onDrillToNode?.(result.node)
          } else {
            onSelectNode?.(result.node)
          }
        } else {
          onSelectNode?.(result.node)
        }
        return
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [open, results, selectedIdx, activeChip, onClose, onSelectNode, onDrillToNode])

  if (!open) return null

  const hasQuery   = query.length > 0
  const hasResults = results.length > 0
  const rootPath   = currentRoot?.path
  const sc         = getSearchColors(colorTheme)

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 600,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        background: sc.overlay,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Node search"
        style={{
          width: '92vw', maxWidth: 640,
          background: sc.dialogBg,
          border: `1px solid ${sc.dialogBorder}`,
          boxShadow: sc.dialogShadow,
          borderRadius: 18,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: `1px solid ${sc.divider}`,
        }}>
          <span style={{ fontSize: 16, opacity: 0.4, flexShrink: 0 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes, files, folders, or signals…"
            aria-label="Search nodes"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: sc.inputText,
              fontFamily: SANS,
              fontSize: 15,
              caretColor: sc.inputCaret,
            }}
          />
          {hasQuery && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{
                background: 'none', border: 'none',
                color: sc.inputBtnColor, fontSize: 16,
                cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                transition: 'color 0.12s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = sc.inputBtnHov}
              onMouseLeave={e => e.currentTarget.style.color = sc.inputBtnColor}
              aria-label="Clear search"
            >×</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{
          display: 'flex', gap: 5, flexWrap: 'wrap',
          padding: '8px 16px',
          borderBottom: `1px solid ${sc.divider}`,
        }}>
          {CHIPS.map(chip => {
            const isActive = activeChip === chip.id
            return (
              <button
                key={chip.id}
                onClick={() => setActiveChip(chip.id)}
                style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '3px 9px', borderRadius: 10,
                  border: isActive ? `1px solid ${sc.chipActiveBorder}` : `1px solid ${sc.chipIdleBorder}`,
                  background: isActive ? sc.chipActiveBg : sc.chipIdleBg,
                  color: isActive ? sc.chipActiveText : sc.chipIdleText,
                  cursor: 'pointer',
                  transition: 'background 0.1s, border-color 0.1s, color 0.1s',
                }}
              >
                {chip.label}
              </button>
            )
          })}
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          role="listbox"
          style={{ maxHeight: 380, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {!hasResults && hasQuery && (
            <div style={{ padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontSize: 14, color: sc.rowNameIdle, marginBottom: 8 }}>
                No matching nodes
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: sc.emptyText }}>
                Try a filename, folder, path segment, or signal like &lsquo;todo&rsquo;
              </div>
            </div>
          )}
          {!hasResults && !hasQuery && (
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: sc.emptyText }}>
                Start typing to search nodes
              </div>
            </div>
          )}
          {results.map((result, i) => {
            const actLvl = activityIndex
              ? getActivityLevel(activityIndex[result.node.path] ?? null)
              : null
            const archCluster = archMode ? classifyNode(result.node).cluster : null
            return (
              <div key={result.node.id ?? result.node.path} ref={i === selectedIdx ? activeRowRef : null}>
                <ResultRow
                  result={result}
                  isActive={i === selectedIdx}
                  rootPath={rootPath}
                  onMouseEnter={() => setSelectedIdx(i)}
                  onClick={() => onSelectNode?.(result.node)}
                  onQuickOpen={(path) => { openNode(path, 'editor').catch(console.error); onClose?.() }}
                  sc={sc}
                  activityLevel={actLvl}
                  archCluster={archCluster}
                />
              </div>
            )
          })}
        </div>

        {/* Keyboard hint */}
        <div style={{
          padding: '7px 18px',
          borderTop: `1px solid ${sc.divider}`,
          fontFamily: MONO, fontSize: 9,
          color: sc.hintText,
          display: 'flex', gap: 12, flexWrap: 'wrap',
        }}>
          <span>Enter — select</span>
          <span>Ctrl+Enter — drill in</span>
          <span>↑↓ — navigate</span>
          <span>Tab — cycle filter</span>
          <span>Esc — close</span>
        </div>
      </div>
    </div>
  )
}
