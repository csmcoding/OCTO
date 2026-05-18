import { describe, it, expect } from 'vitest'
import { exportMarkdown } from '../utils/exportMarkdown'

const mockRoot = {
  name: 'src',
  type: 'folder',
  path: '/proj/src',
  signals: {},
  children: [
    {
      id: '1', name: 'index.js', type: 'file',
      path: '/proj/src/index.js', signals: {},
    },
    {
      id: '2', name: 'api', type: 'folder',
      path: '/proj/src/api', signals: { gitDirty: true }, children: [],
    },
  ],
}

const mockStack = [
  { name: 'root', path: '/proj' },
  { name: 'src',  path: '/proj/src' },
]

describe('exportMarkdown', () => {
  it('includes navigation path', () => {
    const md = exportMarkdown({ currentRoot: mockRoot, navStack: mockStack, pins: [] })
    expect(md).toContain('root / src')
  })

  it('lists tree node names', () => {
    const md = exportMarkdown({ currentRoot: mockRoot, navStack: mockStack, pins: [] })
    expect(md).toContain('index.js')
    expect(md).toContain('api')
  })

  it('flags gitDirty nodes in signals section', () => {
    const md = exportMarkdown({ currentRoot: mockRoot, navStack: mockStack, pins: [] })
    expect(md).toContain('gitDirty')
    expect(md).toContain('## Signals')
  })

  it('lists pinned nodes', () => {
    const pin = { id: '3', name: 'README.md', type: 'file', path: '/proj/README.md' }
    const md = exportMarkdown({ currentRoot: mockRoot, navStack: mockStack, pins: [pin] })
    expect(md).toContain('/proj/README.md')
    expect(md).toContain('## Pinned')
  })

  it('handles empty state without crash', () => {
    const md = exportMarkdown({ currentRoot: null, navStack: [], pins: [] })
    expect(typeof md).toBe('string')
    expect(md).toContain('OCTO Snapshot')
  })
})
