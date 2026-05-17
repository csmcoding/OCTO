import { vi, describe, it, expect, afterEach } from 'vitest'
import { loadTree, loadSubtree } from '../utils/loadTree'

function mockFetch(ok, data = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadTree', () => {
  it('calls correct URL with depth param', async () => {
    const fetch = mockFetch(true, { id: 'root' })
    vi.stubGlobal('fetch', fetch)
    await loadTree(2)
    expect(fetch).toHaveBeenCalledWith('http://localhost:7823/tree?depth=2')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(false))
    await expect(loadTree(2)).rejects.toThrow('Failed to load tree: 500')
  })
})

describe('loadSubtree', () => {
  it('URL-encodes the path', async () => {
    const fetch = mockFetch(true, { id: 'sub' })
    vi.stubGlobal('fetch', fetch)
    await loadSubtree('/home/user/my dir', 3)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:7823/subtree?path=%2Fhome%2Fuser%2Fmy%20dir&depth=3'
    )
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(false))
    await expect(loadSubtree('/some/path', 3)).rejects.toThrow('Failed to load subtree')
  })
})
