import { describe, it, expect } from 'vitest'
import { computeProjection, findClosestNode } from '../utils/projectMinimap.js'

describe('computeProjection', () => {
  // 1. symmetric positions project origin to canvas center
  it('projects origin to canvas center when positions are symmetric', () => {
    const positions = [
      { x: -5, y: 0, z: -5 },
      { x:  5, y: 0, z:  5 },
    ]
    const { project } = computeProjection(positions, 200, 100)
    const center = project({ x: 0, y: 0, z: 0 })
    expect(center.x).toBeCloseTo(100, 0)
    expect(center.y).toBeCloseTo(50, 0)
  })

  // 2. y component shifts vertical projection by 0.35 factor
  it('y component shifts projected y by 0.35 * scale', () => {
    const positions = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 }]
    const { project, scale } = computeProjection(positions, 200, 200)
    const p0 = project({ x: 0, y: 0, z: 0 })
    const p1 = project({ x: 0, y: 10, z: 0 })
    expect(p1.y - p0.y).toBeCloseTo(10 * 0.35 * scale, 3)
  })

  // 3. empty positions returns center fallback
  it('empty positions returns canvas center for any point', () => {
    const { project } = computeProjection([], 100, 80)
    const p = project({ x: 999, y: 999, z: 999 })
    expect(p.x).toBe(50)
    expect(p.y).toBe(40)
  })

  // 4. single position does not crash; projects to canvas center
  it('single position projects to canvas center', () => {
    const positions = [{ x: 3, y: 1, z: -2 }]
    const { project } = computeProjection(positions, 240, 180)
    const p = project(positions[0])
    expect(p.x).toBeCloseTo(120, 0)
    expect(p.y).toBeCloseTo(90, 0)
  })
})

describe('findClosestNode', () => {
  const mkEntry = (id, name) => ({ node: { id, name } })

  // 5. returns node at clicked position
  it('returns the node whose projected point is closest to click', () => {
    const entries = [mkEntry('a', 'alpha'), mkEntry('b', 'beta')]
    const pts = [{ x: 10, y: 10 }, { x: 90, y: 90 }]
    const result = findClosestNode(11, 11, pts, entries, 15)
    expect(result.id).toBe('a')
  })

  // 6. returns null when click is too far from all nodes
  it('returns null when click is farther than threshold from all nodes', () => {
    const entries = [mkEntry('a', 'alpha')]
    const pts = [{ x: 50, y: 50 }]
    const result = findClosestNode(10, 10, pts, entries, 12)
    expect(result).toBeNull()
  })

  // 7. respects threshold boundary exactly
  it('returns null at threshold distance and node just inside threshold', () => {
    const entries = [mkEntry('x', 'x')]
    const pts = [{ x: 0, y: 0 }]
    const exactly = findClosestNode(12, 0, pts, entries, 12)
    expect(exactly).toBeNull()  // Math.hypot(12,0)=12, not < 12

    const inside = findClosestNode(11, 0, pts, entries, 12)
    expect(inside?.id).toBe('x')
  })

  // 8. picks closest when multiple nodes are within threshold
  it('picks the closest node when multiple are within threshold', () => {
    const entries = [mkEntry('near', 'near'), mkEntry('far', 'far')]
    const pts = [{ x: 5, y: 0 }, { x: 10, y: 0 }]
    const result = findClosestNode(6, 0, pts, entries, 15)
    expect(result.id).toBe('near')
  })
})
