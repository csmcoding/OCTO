import { describe, it, expect } from 'vitest'
import { fuzzySearch, scoreNode } from '../utils/fuzzySearch.js'

// ── helpers ─────────────────────────────────────────────────────────────────

const file   = (name, path, signals = {}) => ({ id: path, name, path, type: 'file',   signals })
const folder = (name, path, signals = {}) => ({ id: path, name, path, type: 'folder', signals })

// ── scoreNode ────────────────────────────────────────────────────────────────

describe('scoreNode', () => {
  it('exact name match has highest base score', () => {
    const r = scoreNode(file('panel', '/panel'), 'panel')
    expect(r).not.toBeNull()
    expect(r.score).toBeGreaterThanOrEqual(100)
  })

  it('name startsWith scores above path-only match', () => {
    const starts = scoreNode(file('panelHeader', '/x/panelHeader'), 'panel')
    const pathOnly = scoreNode(file('config', '/foo/panel/config'), 'panel')
    expect(starts).not.toBeNull()
    expect(pathOnly).not.toBeNull()
    expect(starts.score).toBeGreaterThan(pathOnly.score)
  })

  it('returns null for nodes that do not match', () => {
    expect(scoreNode(file('alpha', '/alpha'), 'zzz')).toBeNull()
  })

  it('type filter excludes mismatched nodes', () => {
    expect(scoreNode(folder('src', '/src'), 'src', { typeFilter: 'file' })).toBeNull()
    expect(scoreNode(file('src', '/src.js'), 'src', { typeFilter: 'file' })).not.toBeNull()
  })
})

// ── fuzzySearch ──────────────────────────────────────────────────────────────

describe('fuzzySearch', () => {
  // 1. exact name match ranks above contains match
  it('exact name match ranks above name-contains match', () => {
    const nodes = [
      file('panel',       '/a/panel'),
      file('panelHeader', '/a/panelHeader'),
    ]
    const results = fuzzySearch(nodes, 'panel')
    expect(results[0].node.name).toBe('panel')
  })

  // 2. startsWith ranks above path-only match
  it('name startsWith query ranks above path-only match', () => {
    const nodes = [
      file('config',      '/foo/panel/config'),  // path contains 'panel' → score 40
      file('panelHeader', '/x/panelHeader'),      // name startsWith 'panel' → score 80
    ]
    const results = fuzzySearch(nodes, 'panel')
    expect(results[0].node.name).toBe('panelHeader')
  })

  // 3. signal match boosts result
  it('signal presence boosts score above equal-name match', () => {
    const nodes = [
      file('app', '/a/app'),
      file('app', '/b/app', { gitDirty: true }),
    ]
    const results = fuzzySearch(nodes, 'app')
    // Both get exact match (100); signal node gets +10 → 110
    expect(results[0].node.signals?.gitDirty).toBe(true)
  })

  // 4. type filter excludes mismatched nodes
  it('typeFilter:folder excludes file nodes', () => {
    const nodes = [
      folder('src',    '/src'),
      file  ('src.js', '/src.js'),
    ]
    const results = fuzzySearch(nodes, 'src', { typeFilter: 'folder' })
    expect(results).toHaveLength(1)
    expect(results[0].node.type).toBe('folder')
  })

  // 5. empty query returns sensible default set
  it('empty query returns all passing nodes (up to 30)', () => {
    const nodes = Array.from({ length: 10 }, (_, i) =>
      file(`node${i}`, `/node${i}`)
    )
    const results = fuzzySearch(nodes, '')
    expect(results).toHaveLength(10)
  })

  // 6. returns max 30 results
  it('caps results at 30 regardless of node count', () => {
    const nodes = Array.from({ length: 50 }, (_, i) =>
      file(`item${i}`, `/item${i}`)
    )
    const results = fuzzySearch(nodes, 'item')
    expect(results.length).toBeLessThanOrEqual(30)
  })

  // 7. folders win tie over files
  it('folders rank before files when scores are equal', () => {
    const nodes = [
      file  ('src', '/a/src.js'),
      folder('src', '/b/src'),
    ]
    const results = fuzzySearch(nodes, 'src')
    expect(results[0].node.type).toBe('folder')
  })
})
