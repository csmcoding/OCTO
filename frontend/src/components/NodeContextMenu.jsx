import { useRef, useEffect, useState } from 'react'
import { openNode } from '../utils/loadTree'

export function getMenuItems(node) {
  if (!node) return []
  if (node.type === 'folder') {
    return [
      { label: '⬡  Open in Cursor',        action: 'editor'      },
      { label: '⬡  Open in Dolphin',        action: 'files'       },
      { label: '⬡  Open in Konsole',        action: 'terminal'    },
      { isDivider: true },
      { label: '⬡  Copy path',              action: 'copyPath'    },
      { label: '⬡  Copy relative path',     action: 'copyRelPath' },
      { label: '⬡  Drill into folder',      action: 'drillIn'     },
    ]
  }
  return [
    { label: '⬡  Open in Cursor',           action: 'editor'      },
    { label: '⬡  Reveal in files',          action: 'reveal'      },
    { isDivider: true },
    { label: '⬡  Copy path',                action: 'copyPath'    },
    { label: '⬡  Copy relative path',       action: 'copyRelPath' },
  ]
}

function MenuItem({ label, onClick, sc }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        padding: '7px 14px',
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 12,
        color: hovered ? sc.labelHov : sc.label,
        background: hovered ? sc.bgHov : 'transparent',
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

export default function NodeContextMenu({ node, position, onClose, onDrillIn, isPinned, onPinToggle, rootPath = null, colorTheme = 'dark' }) {
  const menuRef = useRef()
  const isLight = colorTheme === 'light'

  const sc = {
    menuBg:     isLight ? 'rgba(240,245,252,0.97)' : 'rgba(6,6,16,0.97)',
    menuBorder: isLight ? 'rgba(0,100,140,0.2)'    : 'rgba(124,157,245,0.25)',
    menuShadow: isLight ? '0 4px 24px rgba(0,60,100,0.15)' : '0 4px 24px rgba(0,0,0,0.75)',
    divider:    isLight ? 'rgba(0,100,140,0.08)'   : 'rgba(124,157,245,0.12)',
    label:      isLight ? 'rgba(30,60,100,0.75)'   : '#b0b0cc',
    labelHov:   isLight ? '#1a2a3a'                : '#e2e2f2',
    bgHov:      isLight ? 'rgba(0,100,140,0.08)'   : 'rgba(124,157,245,0.12)',
  }

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
    if (action === 'pin') {
      onPinToggle?.()
    } else if (action === 'copyPath') {
      navigator.clipboard.writeText(node.path).catch(console.error)
    } else if (action === 'copyRelPath') {
      const rel = rootPath && node.path.startsWith(rootPath)
        ? node.path.slice(rootPath.length).replace(/^\//, '') || node.name
        : node.path
      navigator.clipboard.writeText(rel).catch(console.error)
    } else if (action === 'drillIn') {
      onDrillIn(node)
    } else {
      openNode(node.path, action).catch(console.error)
    }
  }

  const items = [
    ...getMenuItems(node),
    { isDivider: true },
    { label: isPinned ? '★  Unpin' : '☆  Pin to tray', action: 'pin' },
  ]

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: sc.menuBg,
        border: `1px solid ${sc.menuBorder}`,
        backdropFilter: 'blur(8px)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 172,
        zIndex: 500,
        boxShadow: sc.menuShadow,
        animation: 'fadeIn 0.12s ease',
      }}
    >
      {items.map((item, i) =>
        item.isDivider ? (
          <div key={i} style={{ height: 1, background: sc.divider, margin: '4px 0' }} />
        ) : (
          <MenuItem key={item.action} label={item.label} onClick={() => handleAction(item.action)} sc={sc} />
        )
      )}
    </div>
  )
}
