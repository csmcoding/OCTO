/**
 * Computes a 2D projection for the minimap from 3D scene positions.
 * Uses x as horizontal, (z + y * 0.35) as vertical — slight isometric tilt.
 *
 * Returns { project, scale } where project(p) maps a {x,y,z} → {x,y} in canvas pixels.
 * The same projection is reusable for camera markers drawn over the same canvas.
 */
export function computeProjection(positions, width, height, padding = 10) {
  if (!positions || !positions.length) {
    return {
      project: () => ({ x: width / 2, y: height / 2 }),
      scale: 1,
    }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const p of positions) {
    const px = p.x
    const py = p.z + (p.y ?? 0) * 0.35
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
  }

  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const scale = Math.min(
    (width  - padding * 2) / rangeX,
    (height - padding * 2) / rangeY,
  )
  const offX = width  / 2 - ((minX + maxX) / 2) * scale
  const offY = height / 2 - ((minY + maxY) / 2) * scale

  return {
    project: (p) => ({
      x: p.x * scale + offX,
      y: (p.z + (p.y ?? 0) * 0.35) * scale + offY,
    }),
    scale,
  }
}

/**
 * Finds the layout entry whose projected position is closest to a canvas click.
 * Returns entry.node or null if nothing is within `threshold` pixels.
 */
export function findClosestNode(canvasX, canvasY, pts, entries, threshold = 12) {
  let closest = null
  let closestDist = threshold
  for (let i = 0; i < entries.length; i++) {
    const d = Math.hypot(canvasX - pts[i].x, canvasY - pts[i].y)
    if (d < closestDist) {
      closest = entries[i].node
      closestDist = d
    }
  }
  return closest
}
