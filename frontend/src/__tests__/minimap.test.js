import { describe, it, expect, vi } from 'vitest'
import { computeProjection, findClosestNode } from '../utils/projectMinimap.js'
import { EXP_W, EXP_H, COL_W, COL_H } from '../components/Minimap.jsx'

const mkEntry = (id, name, x = 0, z = 0) => ({
  node: { id, name, type: 'file', signals: {} },
  endPosition: { x, y: 0, z },
})

// ── dimension constants ──────────────────────────────────────────────────────

describe('Minimap — dimensions', () => {
  // 1. expanded dimensions
  it('expanded state is 240 × 180', () => {
    expect(EXP_W).toBe(240)
    expect(EXP_H).toBe(180)
  })

  // 2. collapsed dimensions
  it('collapsed state is 44 × 44', () => {
    expect(COL_W).toBe(44)
    expect(COL_H).toBe(44)
  })
})

// ── click-to-jump logic ──────────────────────────────────────────────────────

describe('Minimap — click-to-jump', () => {
  const entries = [
    mkEntry('folder-a', 'src',   -4, -3),
    mkEntry('file-b',   'index',  4,  3),
  ]
  const positions = entries.map(e => e.endPosition)
  const proj = computeProjection(positions, EXP_W, EXP_H, 14)
  const pts  = positions.map(proj.project)

  // 3. clicking near a node returns that node
  it('returns the node nearest the click', () => {
    const { x, y } = pts[0]
    const node = findClosestNode(x + 2, y + 2, pts, entries)
    expect(node.id).toBe('folder-a')
  })

  // 4. clicking far from all nodes returns null
  it('returns null when click is far from all nodes', () => {
    const node = findClosestNode(-100, -100, pts, entries)
    expect(node).toBeNull()
  })

  // 5. onJumpToNode callback fires with correct node
  it('onJumpToNode is called with the clicked node', () => {
    const onJumpToNode = vi.fn()
    const { x, y } = pts[1]
    const node = findClosestNode(x, y, pts, entries)
    if (node) onJumpToNode(node)
    expect(onJumpToNode).toHaveBeenCalledWith(entries[1].node)
  })
})

// ── camera projection ────────────────────────────────────────────────────────

describe('Minimap — camera projection', () => {
  // 6. camera position projected using the same projection as nodes
  it('camera projected point is consistent with node projection bounds', () => {
    const entries = [mkEntry('n', 'n', 5, 5), mkEntry('m', 'm', -5, -5)]
    const positions = entries.map(e => e.endPosition)
    const { project } = computeProjection(positions, EXP_W, EXP_H, 14)

    // Camera orbiting at (0, 4, 10) — further out than nodes
    const cam = project({ x: 0, y: 4, z: 10 })
    // It may land outside the canvas but must be a valid number
    expect(Number.isFinite(cam.x)).toBe(true)
    expect(Number.isFinite(cam.y)).toBe(true)
  })

  // 7. camera at origin projects to canvas center (when nodes are symmetric)
  it('camera at origin projects to canvas center when nodes are symmetric', () => {
    const positions = [
      { x: -5, y: 0, z: -5 },
      { x:  5, y: 0, z:  5 },
    ]
    const { project } = computeProjection(positions, EXP_W, EXP_H, 14)
    const cam = project({ x: 0, y: 0, z: 0 })
    expect(cam.x).toBeCloseTo(EXP_W / 2, 0)
    expect(cam.y).toBeCloseTo(EXP_H / 2, 0)
  })
})

// ── label logic ──────────────────────────────────────────────────────────────

describe('Minimap — label visibility logic', () => {
  // 8. selected or hovered nodes should have labels; plain nodes should not
  it('selected/hovered nodes receive labels, others do not', () => {
    const selectedId = 'folder-a'
    const entries = [
      mkEntry('folder-a', 'src',   -4, -3),
      mkEntry('file-b',   'index',  4,  3),
    ]
    const shouldLabel = entries.map(e =>
      e.node.id === selectedId || e.node.id === 'HOVERED_ID'
    )
    expect(shouldLabel[0]).toBe(true)   // selected
    expect(shouldLabel[1]).toBe(false)  // neither
  })
})
