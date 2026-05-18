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
    expect(buildTentacleLayout(MOCK_NODES, 5.5)).toHaveLength(5)
  })

  it('each entry has node, endPosition, curve', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.5)
    for (const entry of layout) {
      expect(entry).toHaveProperty('node')
      expect(entry).toHaveProperty('endPosition')
      expect(entry).toHaveProperty('curve')
    }
  })

  it('endPosition is a THREE.Vector3', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.5)
    for (const { endPosition } of layout) {
      expect(endPosition).toBeInstanceOf(Vector3)
    }
  })

  it('curve is a CatmullRomCurve3 with 4 points', () => {
    const layout = buildTentacleLayout(MOCK_NODES, 5.5)
    for (const { curve } of layout) {
      expect(curve).toBeInstanceOf(CatmullRomCurve3)
      expect(curve.points).toHaveLength(4)
    }
  })

  it('empty nodes array returns []', () => {
    expect(buildTentacleLayout([], 5.5)).toEqual([])
  })
})
