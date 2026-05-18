import { describe, it, expect } from 'vitest'

function pinReducer(pins, action) {
  switch (action.type) {
    case 'pin':
      return pins.some(p => p.id === action.node.id)
        ? pins
        : [...pins, action.node]
    case 'unpin':
      return pins.filter(p => p.id !== action.node.id)
    default:
      return pins
  }
}

describe('pin state logic', () => {
  const node  = { id: 'a', name: 'src', type: 'folder' }
  const node2 = { id: 'b', name: 'lib', type: 'folder' }

  it('pins a node', () => {
    const result = pinReducer([], { type: 'pin', node })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })

  it('does not duplicate a pin', () => {
    const result = pinReducer([node], { type: 'pin', node })
    expect(result).toHaveLength(1)
  })

  it('unpins a node', () => {
    const result = pinReducer([node, node2], { type: 'unpin', node })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('unpin nonexistent is a no-op', () => {
    const result = pinReducer([node2], { type: 'unpin', node })
    expect(result).toHaveLength(1)
  })
})
