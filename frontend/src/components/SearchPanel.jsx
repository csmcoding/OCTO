import { useState, useEffect, useRef, useMemo } from 'react'
import { fuzzySearch } from '../utils/fuzzySearch.js'
import { getActiveSignals, SIGNAL_COLORS } from '../utils/signals.js'

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SANS = "'Outfit', 'Inter', system-ui, sans-serif"

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

function ResultRow({ result, isActive, rootPath, onMouseEnter, onClick }) {
  const { node, matchReason } = result
  const path = relPath(node.path, rootPath)
  const displayPath = path.length > 60 ? '…' + path.slice(-60) : path

  return (
    <div
      role="option"
      aria-selected={isActive}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      style={{
        padding: '9px 16px',
        cursor: 'pointer',
        background: isActive ? 'rgba(110,231,220,0.12)' : 'transparent',
        borderLeft: isActive ? '2px solid rgba(78,205,196,0.7)' : '2px solid transparent',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        transition: 'background 0.08s',
        boxShadow: isActive ? 'inset 0 0 12px rgba(78,205,196,0.04)' : 'none',
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
            color: isActive ? '#f0f4ff' : 'rgba(220,230,245,0.9)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {node.name}
          </span>
          <TypeBadge type={node.type} />
        </div>
        <div style={{
          fontFamily: MONO, fontSize: 10,
          color: 'rgba(220,230,245,0.45)',
          marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}>
          {displayPath}
        </div>
      </div>

      {/* Right side: signal dots + match reason */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
        <SignalDots node={node} />
        {matchReason && (
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(110,231,220,0.4)', whiteSpace: 'nowrap' }}>
            {matchReason}
          </span>
        )}
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
    }),
  [nodes, query, chip.typeFilter, chip.signalFilter])

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

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 600,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        background: 'rgba(3,6,12,0.52)',
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
          background: '#151823',
          border: '1px solid rgba(110,231,220,0.12)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(78,205,196,0.06)',
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
          borderBottom: '1px solid rgba(110,231,220,0.07)',
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
              color: 'rgba(230,238,255,0.95)',
              fontFamily: SANS,
              fontSize: 15,
              caretColor: '#4ecdc4',
            }}
          />
          {hasQuery && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(220,230,245,0.35)', fontSize: 16,
                cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                transition: 'color 0.12s', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(220,230,245,0.8)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(220,230,245,0.35)'}
              aria-label="Clear search"
            >×</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{
          display: 'flex', gap: 5, flexWrap: 'wrap',
          padding: '8px 16px',
          borderBottom: '1px solid rgba(110,231,220,0.07)',
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
                  border: isActive
                    ? '1px solid rgba(78,205,196,0.55)'
                    : '1px solid rgba(110,231,220,0.14)',
                  background: isActive
                    ? 'rgba(78,205,196,0.14)'
                    : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#6ee7dc' : 'rgba(220,230,245,0.55)',
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
              <div style={{ fontFamily: SANS, fontSize: 14, color: 'rgba(220,230,245,0.65)', marginBottom: 8 }}>
                No matching nodes
              </div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(220,230,245,0.35)' }}>
                Try a filename, folder, path segment, or signal like &lsquo;todo&rsquo;
              </div>
            </div>
          )}
          {!hasResults && !hasQuery && (
            <div style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(220,230,245,0.3)' }}>
                Start typing to search nodes
              </div>
            </div>
          )}
          {results.map((result, i) => (
            <div key={result.node.id ?? result.node.path} ref={i === selectedIdx ? activeRowRef : null}>
              <ResultRow
                result={result}
                isActive={i === selectedIdx}
                rootPath={rootPath}
                onMouseEnter={() => setSelectedIdx(i)}
                onClick={() => onSelectNode?.(result.node)}
              />
            </div>
          ))}
        </div>

        {/* Keyboard hint */}
        <div style={{
          padding: '7px 18px',
          borderTop: '1px solid rgba(110,231,220,0.07)',
          fontFamily: MONO, fontSize: 9,
          color: 'rgba(220,230,245,0.25)',
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
