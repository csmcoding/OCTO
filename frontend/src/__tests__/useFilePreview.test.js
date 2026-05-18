import { describe, it, expect } from 'vitest'
import { buildPreviewUrl, shouldFetchPreview } from '../hooks/useFilePreview'

describe('useFilePreview helpers', () => {
  it('shouldFetchPreview returns false for folder nodes', () => {
    expect(shouldFetchPreview({ type: 'folder', path: '/a' })).toBe(false)
  })

  it('shouldFetchPreview returns true for file nodes', () => {
    expect(shouldFetchPreview({ type: 'file', path: '/a/b.py' })).toBe(true)
  })

  it('buildPreviewUrl encodes path and includes lines param', () => {
    const url = buildPreviewUrl('/home/user/my file.py', 60)
    expect(url).toContain('path=%2Fhome%2Fuser%2Fmy%20file.py')
    expect(url).toContain('lines=60')
  })
})
