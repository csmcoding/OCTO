import { Vector3, CatmullRomCurve3 } from 'three'

/**
 * Distributes N nodes on a sphere using the Fibonacci sphere algorithm.
 * Returns { node, endPosition, curve, basePoints } per node.
 */
export function buildTentacleLayout(nodes, radius = 5.2) {
  const count = nodes.length
  if (count === 0) return []

  const phi = Math.PI * (Math.sqrt(5) - 1) // golden angle

  return nodes.map((node, i) => {
    const y = 1 - (i / (count - 1 || 1)) * 2    // -1 to 1 pole-to-pole
    const rr = Math.sqrt(Math.max(0, 1 - y * y)) // latitude radius
    const theta = phi * i

    const end = new Vector3(
      Math.cos(theta) * rr * radius,
      y * radius,
      Math.sin(theta) * rr * radius,
    )

    const dir = end.clone().normalize()
    const start = dir.clone().multiplyScalar(0.55)

    // Perpendicular in XZ plane — gives each tentacle a unique bow direction.
    // Guard against poles where dir is purely vertical (XZ components zero).
    const perpRaw = new Vector3(-dir.z, 0, dir.x)
    const perp = perpRaw.lengthSq() > 1e-6
      ? perpRaw.normalize()
      : new Vector3(1, 0, 0)

    const bow = (i % 2 === 0 ? 1 : -1) * 0.6
    const yWave = Math.sin(i * 1.3)

    const p1 = new Vector3(
      dir.x * radius * 0.32 + perp.x * bow * 0.8,
      dir.y * radius * 0.32 + yWave * 0.5,
      dir.z * radius * 0.32 + perp.z * bow * 0.8,
    )

    const p2 = new Vector3(
      dir.x * radius * 0.70 + perp.x * bow * 0.3,
      dir.y * radius * 0.70 + yWave * 0.2,
      dir.z * radius * 0.70 + perp.z * bow * 0.3,
    )

    const basePoints = [start, p1, p2, end.clone()]
    const curve = new CatmullRomCurve3(basePoints.map(p => p.clone()))

    return { node, endPosition: end, curve, basePoints }
  })
}

/**
 * Resets curve control points to basePoints then adds a time-based offset.
 * Safe to call every frame — no accumulated drift.
 */
export function swayTentacle(curve, basePoints, index, time, amplitude = 0.12) {
  const phase = index * 0.92
  const t = time * 0.6

  curve.points[1].copy(basePoints[1]).add(new Vector3(
    Math.sin(t + phase)        * amplitude,
    Math.cos(t * 0.7 + phase)  * amplitude * 0.5,
    Math.sin(t * 1.1 + phase)  * amplitude * 0.6,
  ))
  curve.points[2].copy(basePoints[2]).add(new Vector3(
    Math.cos(t * 0.8 + phase + 1) * amplitude * 0.7,
    Math.sin(t * 0.6 + phase + 1) * amplitude * 0.3,
    Math.cos(t        + phase + 1) * amplitude * 0.5,
  ))
}
