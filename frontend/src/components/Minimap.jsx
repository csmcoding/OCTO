import { useRef, useEffect } from 'react'
import { getNodeColor } from '../utils/palette'

const MAP_SIZE = 154
const MAP_PAD  = 18
const CENTER   = MAP_SIZE / 2

export default function Minimap({ layout, hoveredId, selectedId, onNodeClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !layout?.length) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width  = MAP_SIZE * dpr
    canvas.height = MAP_SIZE * dpr
    ctx.scale(dpr, dpr)

    let raf
    const draw = () => {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)

      ctx.fillStyle = 'rgba(6,6,18,0.0)'
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

      ctx.strokeStyle = 'rgba(124,157,245,0.07)'
      ctx.lineWidth = 0.5
      for (const r of [28, 52, 72]) {
        ctx.beginPath()
        ctx.arc(CENTER, CENTER, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      const maxR = Math.max(
        ...layout.map(({ endPosition: p }) => Math.sqrt(p.x * p.x + p.z * p.z)),
        0.01,
      )
      const scale = (MAP_SIZE / 2 - MAP_PAD) / maxR

      layout.forEach(({ endPosition: p }) => {
        const mx = CENTER + p.x * scale
        const my = CENTER + p.z * scale
        ctx.beginPath()
        ctx.moveTo(CENTER, CENTER)
        ctx.lineTo(mx, my)
        ctx.strokeStyle = 'rgba(124,157,245,0.08)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      })

      layout.forEach(({ node, endPosition: p }) => {
        const mx = CENTER + p.x * scale
        const my = CENTER + p.z * scale
        const color = getNodeColor(node)
        const isHov = node.id === hoveredId
        const isSel = node.id === selectedId
        const r = isSel ? 5.5 : isHov ? 4.5 : 3.2

        if (isHov || isSel) {
          ctx.beginPath()
          ctx.arc(mx, my, r + 4, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(mx, my, 0, mx, my, r + 4)
          grad.addColorStop(0, `${color}44`)
          grad.addColorStop(1, `${color}00`)
          ctx.fillStyle = grad
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(mx, my, r, 0, Math.PI * 2)
        ctx.fillStyle = isSel ? color : isHov ? color + 'cc' : color + '88'
        ctx.fill()

        if (isSel) {
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.stroke()
        }
      })

      ctx.beginPath()
      ctx.arc(CENTER, CENTER, 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(200,200,240,0.5)'
      ctx.fill()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [layout, hoveredId, selectedId])

  const handleClick = (e) => {
    if (!layout?.length) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) * (MAP_SIZE / rect.width)
    const ly = (e.clientY - rect.top)  * (MAP_SIZE / rect.height)

    const maxR = Math.max(
      ...layout.map(({ endPosition: p }) => Math.sqrt(p.x * p.x + p.z * p.z)),
      0.01,
    )
    const scale = (MAP_SIZE / 2 - MAP_PAD) / maxR

    let closest = null, closestDist = 12
    layout.forEach(({ node, endPosition: p }) => {
      const mx = CENTER + p.x * scale
      const my = CENTER + p.z * scale
      const d = Math.hypot(lx - mx, ly - my)
      if (d < closestDist) { closest = node; closestDist = d }
    })

    if (closest) onNodeClick?.(closest)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 80,
      width: MAP_SIZE,
      height: MAP_SIZE,
      background: 'rgba(6,6,18,0.82)',
      border: '1px solid rgba(124,157,245,0.14)',
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        position: 'absolute', top: 7, left: 10, right: 10,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, color: 'rgba(110,110,158,0.55)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        pointerEvents: 'none',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {layout?.length ?? 0} nodes
      </div>
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        onClick={handleClick}
        style={{ width: MAP_SIZE, height: MAP_SIZE, cursor: 'crosshair', display: 'block' }}
      />
    </div>
  )
}
