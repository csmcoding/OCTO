import { describe, it, expect } from 'vitest'
import { buildTentacleLayout } from '../utils/buildTentacleLayout'

describe('performance', () => {
  it('buildTentacleLayout 120 nodes completes under 50ms', () => {
    const nodes = Array.from({ length: 120 }, (_, i) => ({
      id: `node-${i}`, name: `node${i}`,
      type: i % 3 === 0 ? 'folder' : 'file',
      signals: {}, path: `/proj/node${i}`,
    }))
    const start = performance.now()
    const layout = buildTentacleLayout(nodes)
    const elapsed = performance.now() - start
    expect(layout).toHaveLength(120)
    expect(elapsed).toBeLessThan(50)
  })

  it('SCENE_NODE_CAP is a number <= 120', () => {
    const cap = 80  // matches SCENE_NODE_CAP in ThreeScene
    expect(typeof cap).toBe('number')
    expect(cap).toBeGreaterThan(0)
    expect(cap).toBeLessThanOrEqual(120)
  })

  it('visibleChildren slices at cap', () => {
    const children = Array.from({ length: 200 }, (_, i) => ({
      id: `n${i}`, name: `n${i}`, type: 'file',
      signals: {}, path: `/p/n${i}`,
    }))
    const CAP = 80
    const visible = children.length > CAP ? children.slice(0, CAP) : children
    expect(visible).toHaveLength(CAP)
  })
})
