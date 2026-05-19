import { useRef, useEffect } from 'react'
import { getNodeColor } from '../utils/palette'
import { computeProjection, findClosestNode } from '../utils/projectMinimap'

export { findClosestNode }

const EXP_W = 240
const EXP_H = 180
const COL_W = 44
const COL_H = 44
const PAD   = 14

export { EXP_W, EXP_H, COL_W, COL_H }

export default function Minimap({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  currentRoot,
  cameraPosition,
  onJumpToNode,
  collapsed,
  onToggleCollapsed,
  colorTheme = 'dark',
}) {
  const isLight = colorTheme === 'light'
  const mmBg     = isLight ? 'rgba(235,240,250,0.92)' : 'rgba(6,6,18,0.85)'
  const mmBorder = isLight ? 'rgba(0,100,140,0.14)'   : 'rgba(124,157,245,0.14)'
  const mmShadow = isLight ? '0 8px 24px rgba(0,60,100,0.12)' : '0 8px 32px rgba(0,0,0,0.6)'
  const canvasRef = useRef(null)

  useEffect(() => {
    if (collapsed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width  = EXP_W * dpr
    canvas.height = EXP_H * dpr
    ctx.scale(dpr, dpr)

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, EXP_W, EXP_H)

      const entries = nodes ?? []
      const positions = entries.map(e => e.endPosition)
      const proj = computeProjection(positions, EXP_W, EXP_H, PAD)
      const pts = positions.map(proj.project)

      const cx = EXP_W / 2
      const cy = EXP_H / 2

      // Spokes from center
      pts.forEach((pt) => {
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(pt.x, pt.y)
        ctx.strokeStyle = isLight ? 'rgba(0,80,140,0.10)' : 'rgba(124,157,245,0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      // Nodes
      pts.forEach((pt, i) => {
        const node   = entries[i].node
        const color  = getNodeColor(node)
        const isSel  = node.id === selectedNodeId
        const isHov  = node.id === hoveredNodeId
        const r      = isSel ? 5.5 : isHov ? 4.5 : 3.0

        if (isSel || isHov) {
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, r + 4, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r + 4)
          grad.addColorStop(0, color + '44')
          grad.addColorStop(1, color + '00')
          ctx.fillStyle = grad
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
        ctx.fillStyle = isSel ? color : isHov ? color + 'cc' : color + '88'
        ctx.fill()

        if (isSel) {
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.stroke()
        }

        if (isSel || isHov) {
          ctx.font = "8px 'JetBrains Mono', monospace"
          ctx.fillStyle = isSel
            ? (isLight ? 'rgba(20,40,80,0.9)' : 'rgba(230,238,255,0.9)')
            : (isLight ? 'rgba(30,60,100,0.65)' : 'rgba(180,190,220,0.7)')
          ctx.fillText(node.name, pt.x + r + 3, pt.y + 3)
        }
      })

      // Center dot (represents currentRoot)
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fillStyle = isLight ? 'rgba(0,80,120,0.4)' : 'rgba(200,200,240,0.5)'
      ctx.fill()

      // Root label
      if (currentRoot?.name) {
        ctx.font = "7px 'JetBrains Mono', monospace"
        ctx.fillStyle = isLight ? 'rgba(30,60,100,0.4)' : 'rgba(180,185,230,0.45)'
        const label = currentRoot.name
        const tw = ctx.measureText(label).width
        ctx.fillText(label, cx - tw / 2, cy - 8)
      }

      // Camera marker — project onto same coordinate space
      if (cameraPosition && entries.length) {
        const cam = proj.project(cameraPosition)
        const mx = Math.max(6, Math.min(EXP_W - 6, cam.x))
        const my = Math.max(6, Math.min(EXP_H - 6, cam.y))

        // Line from camera toward center
        ctx.beginPath()
        ctx.moveTo(mx, my)
        ctx.lineTo(cx, cy)
        ctx.strokeStyle = isLight ? 'rgba(0,80,140,0.10)' : 'rgba(200,210,255,0.12)'
        ctx.lineWidth = 0.6
        ctx.stroke()

        // Camera eye dot
        ctx.beginPath()
        ctx.arc(mx, my, 3, 0, Math.PI * 2)
        ctx.fillStyle = isLight ? 'rgba(0,80,140,0.45)' : 'rgba(200,210,255,0.55)'
        ctx.fill()
        ctx.strokeStyle = isLight ? 'rgba(0,80,140,0.3)' : 'rgba(200,210,255,0.35)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [nodes, selectedNodeId, hoveredNodeId, cameraPosition, currentRoot, collapsed])

  const handleClick = (e) => {
    const canvas = canvasRef.current
    if (!canvas || !nodes?.length) return
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) * (EXP_W / rect.width)
    const ly = (e.clientY - rect.top)  * (EXP_H / rect.height)

    const positions = nodes.map(en => en.endPosition)
    const proj = computeProjection(positions, EXP_W, EXP_H, PAD)
    const pts  = positions.map(proj.project)
    const node = findClosestNode(lx, ly, pts, nodes)
    if (node) onJumpToNode?.(node)
  }

  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapsed}
        title="Show minimap"
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          zIndex: 80,
          width: COL_W,
          height: COL_H,
          borderRadius: '50%',
          background: mmBg,
          border: `1px solid ${mmBorder}`,
          backdropFilter: 'blur(12px)',
          boxShadow: mmShadow,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isLight ? 'rgba(0,80,120,0.6)' : 'rgba(140,148,200,0.7)',
          fontSize: 16,
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(124,157,245,0.55)'
          e.currentTarget.style.color = 'rgba(180,190,240,0.9)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(124,157,245,0.22)'
          e.currentTarget.style.color = 'rgba(140,148,200,0.7)'
        }}
      >⊕</button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      zIndex: 80,
      width: EXP_W,
      height: EXP_H,
      background: mmBg,
      border: `1px solid ${mmBorder}`,
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
      boxShadow: mmShadow,
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '5px 8px 4px',
        borderBottom: '1px solid rgba(124,157,245,0.07)',
        zIndex: 2,
        background: isLight ? 'rgba(220,230,245,0.5)' : 'rgba(6,6,18,0.5)',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8,
          color: 'rgba(110,110,158,0.55)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 160,
        }}>
          {nodes?.length ?? 0} nodes
        </span>
        <button
          onClick={onToggleCollapsed}
          title="Collapse minimap"
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(124,157,245,0.45)',
            fontSize: 12,
            cursor: 'pointer',
            padding: '0 2px',
            lineHeight: 1,
            transition: 'color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(124,157,245,0.9)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(124,157,245,0.45)' }}
        >−</button>
      </div>

      <canvas
        ref={canvasRef}
        width={EXP_W}
        height={EXP_H}
        onClick={handleClick}
        style={{
          width: EXP_W,
          height: EXP_H,
          cursor: 'crosshair',
          display: 'block',
        }}
      />
    </div>
  )
}
