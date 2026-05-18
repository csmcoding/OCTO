import { describe, it, expect } from 'vitest'
import { Vector3, CatmullRomCurve3 } from 'three'
import { buildTentacleLayout, swayTentacle } from '../utils/buildTentacleLayout'

const MOCK_NODES = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  name: `node${i}`,
  type: i % 2 === 0 ? 'folder' : 'file',
  path: `/p${i}`,
  children: [],
}))

describe('buildTentacleLayout', () => {
  it('returns correct count: 5 nodes → 5 entries', () => {
    expect(buildTentacleLayout(MOCK_NODES, 5.2)).toHaveLength(5)
  })

  it('each entry has node, endPosition, curve, basePoints', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.2)
    for (const entry of layout) {
      expect(entry).toHaveProperty('node')
      expect(entry).toHaveProperty('endPosition')
      expect(entry).toHaveProperty('curve')
      expect(entry).toHaveProperty('basePoints')
    }
  })

  it('endPosition is a THREE.Vector3', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.2)
    for (const { endPosition } of layout) {
      expect(endPosition).toBeInstanceOf(Vector3)
    }
  })

  it('curve is a CatmullRomCurve3 with 4 points', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.2)
    for (const { curve } of layout) {
      expect(curve).toBeInstanceOf(CatmullRomCurve3)
      expect(curve.points).toHaveLength(4)
    }
  })

  it('basePoints is an array of 4 THREE.Vector3', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.2)
    for (const { basePoints } of layout) {
      expect(basePoints).toHaveLength(4)
      for (const p of basePoints) {
        expect(p).toBeInstanceOf(Vector3)
      }
    }
  })

  it('swayTentacle does not drift after 100 calls', () => {
    const layout = buildTentacleLayout([MOCK_NODES[0]], 5.2)
    const { curve, basePoints } = layout[0]
    const amplitude = 0.12

    for (let frame = 0; frame < 100; frame++) {
      swayTentacle(curve, basePoints, 0, frame * 0.016, amplitude)
    }

    // After 100 calls, points must stay within amplitude of basePoints
    for (const idx of [1, 2]) {
      expect(Math.abs(curve.points[idx].x - basePoints[idx].x)).toBeLessThan(amplitude * 2)
      expect(Math.abs(curve.points[idx].y - basePoints[idx].y)).toBeLessThan(amplitude * 2)
      expect(Math.abs(curve.points[idx].z - basePoints[idx].z)).toBeLessThan(amplitude * 2)
    }
  })

  it('empty nodes array returns []', () => {
    expect(buildTentacleLayout([], 5.2)).toEqual([])
  })
})
