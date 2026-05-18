import { Vector3, CatmullRomCurve3 } from 'three'

export function buildTentacleLayout(nodes, radius = 5.5) {
  const count = nodes.length
  if (count === 0) return []

  return nodes.map((node, i) => {
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.35
    const z = 0

    const end = new Vector3(x, y, z)

    const attachDir = end.clone().normalize()
    const start = attachDir.multiplyScalar(0.52)

    const mid = new Vector3(x * 0.55, y * 0.55, 0.4)

    const curve = new CatmullRomCurve3([
      start,
      mid,
      end.clone().normalize().multiplyScalar(radius * 0.85),
      end.clone(),
    ])

    return { node, endPosition: end, curve }
  })
}

/**
 * Apply per-frame sway to a curve's control point.
 * Call inside useFrame. The caller is responsible for resetting
 * curve.points[1] to its original position before each call
 * to prevent accumulated drift.
 */
export function swayTentacle(curve, index, time, amplitude = 0.15) {
  const phase = index * 0.72
  curve.points[1].x += Math.sin(time * 0.7 + phase) * amplitude
  curve.points[1].y += Math.cos(time * 0.5 + phase * 1.3) * amplitude * 0.6
}
