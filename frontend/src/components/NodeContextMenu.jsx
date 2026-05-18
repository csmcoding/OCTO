import { useRef, useEffect, useState } from 'react'
import { openNode } from '../utils/loadTree'

export function getMenuItems(node) {
  if (!node) return []
  if (node.type === 'folder') {
    return [
      { label: '⬡  Open in Cursor',    action: 'editor' },
      { label: '⬡  Open in Dolphin',   action: 'files' },
      { label: '⬡  Open in Konsole',   action: 'terminal' },
      { isDivider: true },
      { label: '⬡  Copy path',         action: 'copyPath' },
      { label: '⬡  Drill into folder', action: 'drillIn' },
    ]
  }
  return [
    { label: '⬡  Open in Cursor', action: 'editor' },
    { isDivider: true },
    { label: '⬡  Copy path', action: 'copyPath' },
  ]
}

function MenuItem({ label, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        padding: '7px 14px',
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 12,
        color: hovered ? '#ffffff' : '#cccce0',
        background: hovered ? 'rgba(74,144,217,0.15)' : 'transparent',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {label}
    </div>
  )
}

export default function NodeContextMenu({ node, position, onClose, onDrillIn }) {
  const menuRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!node) return null

  const handleAction = async (action) => {
    onClose()
    if (action === 'copyPath') {
      navigator.clipboard.writeText(node.path).catch(console.error)
    } else if (action === 'drillIn') {
      onDrillIn(node)
    } else {
      openNode(node.path, action).catch(console.error)
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: 'rgba(5, 5, 18, 0.97)',
        border: '1px solid rgba(74, 144, 217, 0.3)',
        backdropFilter: 'blur(8px)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 160,
        zIndex: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.75)',
        animation: 'fadeIn 0.12s ease',
      }}
    >
      {getMenuItems(node).map((item, i) =>
        item.isDivider ? (
          <div key={i} style={{ height: 1, background: 'rgba(74,144,217,0.15)', margin: '4px 0' }} />
        ) : (
          <MenuItem key={item.action} label={item.label} onClick={() => handleAction(item.action)} />
        )
      )}
    </div>
  )
}
