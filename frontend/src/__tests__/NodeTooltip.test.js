import { describe, it, expect } from 'vitest'
import { getTooltipLines } from '../components/NodeTooltip'

describe('getTooltipLines', () => {
  it('returns null for null node', () => {
    expect(getTooltipLines(null)).toBeNull()
  })

  it('includes node name in output', () => {
    const node = { name: 'projects', type: 'folder', dominantSignal: null }
    expect(getTooltipLines(node).name).toBe('projects')
  })

  it('includes signal label when dominant signal exists', () => {
    const node = { name: 'repo', type: 'folder', dominantSignal: 'gitDirty', dominantColor: '#ff8800', signals: { gitDirty: true } }
    const lines = getTooltipLines(node)
    expect(lines.signalLabel).toBe('Uncommitted changes')
  })

  it('shows "folder" typeLabel for folder nodes', () => {
    const node = { name: 'src', type: 'folder', dominantSignal: null }
    expect(getTooltipLines(node).typeLabel).toBe('folder')
  })

  it('shows file extension for file nodes', () => {
    const node = { name: 'index.js', type: 'file', dominantSignal: null }
    expect(getTooltipLines(node).typeLabel).toBe('.js')
  })
})
