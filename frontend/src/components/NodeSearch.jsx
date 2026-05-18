import { useState, useEffect, useRef } from 'react'
import { searchTree } from '../utils/searchTree'
import { getDominantColor } from '../utils/signals'

export default function NodeSearch({ tree, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setResults(searchTree(tree, query))
    setSelectedIdx(0)
  }, [query, tree])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[selectedIdx]) {
        onSelect(results[selectedIdx])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [results, selectedIdx, onSelect, onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div style={{ width: 480, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search nodes..."
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(6, 6, 16, 0.97)',
            border: '1px solid rgba(124,157,245,0.45)',
            borderRadius: results.length > 0 ? '8px 8px 0 0' : 8,
            color: '#e2e2f2',
            fontFamily: 'monospace',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {results.length > 0 && (
          <div style={{
            background: 'rgba(6, 6, 16, 0.97)',
            border: '1px solid rgba(124,157,245,0.45)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
          }}>
            {results.map((node, i) => {
              const dominantColor = getDominantColor(node)
              const truncPath = node.path.length > 40
                ? '...' + node.path.slice(-40)
                : node.path
              return (
                <div
                  key={node.id || node.path}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    background: i === selectedIdx ? 'rgba(124,157,245,0.12)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                  onClick={() => onSelect(node)}
                  onMouseEnter={() => setSelectedIdx(i)}
                >
                  {dominantColor && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: dominantColor, flexShrink: 0,
                    }} />
                  )}
                  <span style={{ color: '#e2e2f2', fontSize: 13, fontFamily: 'monospace', fontWeight: 500 }}>
                    {node.name}
                  </span>
                  <span style={{ color: '#3a3a5e', fontSize: 11, fontFamily: 'monospace', marginLeft: 'auto' }}>
                    {truncPath}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
