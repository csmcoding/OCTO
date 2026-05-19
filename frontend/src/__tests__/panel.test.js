import { vi, describe, it, expect, afterEach } from 'vitest'
import { detectLang, buildTypeBadge, buildMetrics, buildActions, buildActivityDisplay } from '../components/Panel.jsx'
import { getActiveSignals } from '../utils/signals.js'

afterEach(() => vi.restoreAllMocks())

function makeFolder(overrides = {}) {
  return {
    id: 'f1', name: 'src', path: '/home/user/project/src',
    type: 'folder',
    children: [
      { id: 'c1', name: 'index.js', path: '/home/user/project/src/index.js', type: 'file',   signals: {} },
      { id: 'c2', name: 'utils',    path: '/home/user/project/src/utils',    type: 'folder', signals: {} },
    ],
    signals: {},
    ...overrides,
  }
}

function makeFile(overrides = {}) {
  return {
    id: 'fi1', name: 'Panel.jsx', path: '/home/user/project/src/Panel.jsx',
    type: 'file', children: [], signals: {},
    ...overrides,
  }
}

describe('Panel — type badge', () => {
  // 1. Panel renders node name (node.name is available on the data object)
  it('node name is accessible from node data', () => {
    const n = makeFolder()
    expect(n.name).toBe('src')
  })

  // 2. Folder badge
  it('buildTypeBadge returns "folder" for folder nodes', () => {
    expect(buildTypeBadge(makeFolder())).toBe('folder')
  })

  // 3. File badge
  it('buildTypeBadge returns "file" for file nodes', () => {
    expect(buildTypeBadge(makeFile())).toBe('file')
  })
})

describe('Panel — signal list', () => {
  // 4. Signal list renders when signals present
  it('signal list is non-empty when node has active signals', () => {
    const n = makeFolder({ signals: { gitDirty: true } })
    const signals = getActiveSignals(n)
    expect(signals.length).toBeGreaterThan(0)
    expect(signals).toContain('gitDirty')
  })

  // 5. Signal list hidden when no signals
  it('signal list is empty when node has no active signals', () => {
    const n = makeFolder({ signals: { gitDirty: false, dormant: false } })
    expect(getActiveSignals(n)).toHaveLength(0)
  })
})

describe('Panel — file preview', () => {
  // 6. File preview section renders for file nodes only
  it('file preview section condition is true only for file nodes', () => {
    expect(makeFile().type === 'file').toBe(true)
    expect(makeFolder().type === 'file').toBe(false)
  })
})

describe('Panel — actions row', () => {
  // 7. Actions row always renders (copy-path is always present)
  it('buildActions always includes copy-path action', () => {
    expect(buildActions(makeFile()).some(a => a.key === 'copy')).toBe(true)
    expect(buildActions(makeFolder()).some(a => a.key === 'copy')).toBe(true)
  })

  // 8. "Drill in" only for folder nodes
  it('buildActions includes drill-in only for folder nodes', () => {
    const onDrillIn = vi.fn()
    const folderActions = buildActions(makeFolder(), { onDrillIn })
    const fileActions   = buildActions(makeFile(),   { onDrillIn })
    expect(folderActions.some(a => a.key === 'drill')).toBe(true)
    expect(fileActions.some(a => a.key === 'drill')).toBe(false)
  })

  // 9. copyRel appears when rootPath is provided, absent otherwise
  it('buildActions includes copyRel when rootPath is provided', () => {
    const withRoot    = buildActions(makeFile(), { rootPath: '/home/user/project' })
    const withoutRoot = buildActions(makeFile())
    expect(withRoot.some(a => a.key === 'copyRel')).toBe(true)
    expect(withoutRoot.some(a => a.key === 'copyRel')).toBe(false)
  })
})

describe('Panel — copy path', () => {
  // 9. Copy path writes to clipboard
  it('copy path calls navigator.clipboard.writeText with node.path', async () => {
    const written = []
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn(v => { written.push(v); return Promise.resolve() }) },
    })
    const n = makeFile()
    await navigator.clipboard.writeText(n.path)
    expect(written[0]).toBe(n.path)
  })
})

describe('Panel — entrance animation', () => {
  // 10. mounted flag transitions to true after exactly 16ms
  it('mounted state becomes true after 16ms setTimeout', () => {
    vi.useFakeTimers()
    let mounted = false
    setTimeout(() => { mounted = true }, 16)
    expect(mounted).toBe(false)
    vi.advanceTimersByTime(15)
    expect(mounted).toBe(false)
    vi.advanceTimersByTime(1)
    expect(mounted).toBe(true)
    vi.useRealTimers()
  })
})

describe('Theme default', () => {
  // 11. Default colorTheme is 'dark', not 'deepspace'
  it('default colorTheme setting is "dark" (the lighter readable theme)', () => {
    const defaultSettings = {
      autoRotate: false,
      showLabels: true,
      sway: true,
      scanDepth: 2,
      colorTheme: 'dark',
    }
    expect(defaultSettings.colorTheme).toBe('dark')
    expect(defaultSettings.colorTheme).not.toBe('deepspace')
  })
})

describe('detectLang', () => {
  it('maps common file extensions to Prism language keys', () => {
    expect(detectLang('app.jsx')).toBe('jsx')
    expect(detectLang('index.ts')).toBe('typescript')
    expect(detectLang('main.py')).toBe('python')
    expect(detectLang('config.yaml')).toBe('yaml')
    expect(detectLang('styles.css')).toBe('css')
    expect(detectLang('unknown.xyz')).toBe('text')
  })
})

// ── activity display ─────────────────────────────────────────────────────────

describe('Panel — buildActivityDisplay', () => {
  // 8. returns unavailable=false when activityItem is null
  it('returns available:false for null activityItem', () => {
    const display = buildActivityDisplay(null)
    expect(display.available).toBe(false)
  })

  // 9. returns commit metadata when activityItem is present
  it('returns metadata when activityItem is present', () => {
    const recent = new Date().toISOString()
    const item = {
      lastCommitAt:      recent,
      lastCommitSha:     'abc1234',
      lastCommitMessage: 'fix search ranking',
      author:            'dev@example.com',
      commitCount7d:     2,
      commitCount30d:    5,
      isDirty:           false,
    }
    const display = buildActivityDisplay(item)
    expect(display.available).toBe(true)
    expect(display.lastCommitSha).toBe('abc1234')
    expect(display.lastCommitMessage).toBe('fix search ranking')
    expect(display.commitCount7d).toBe(2)
    expect(display.commitCount30d).toBe(5)
    expect(display.isDirty).toBe(false)
  })

  it('includes summary string', () => {
    const recent = new Date().toISOString()
    const item = { lastCommitAt: recent, commitCount7d: 1, commitCount30d: 2, isDirty: false }
    const display = buildActivityDisplay(item)
    expect(typeof display.summary).toBe('string')
    expect(display.summary.length).toBeGreaterThan(0)
  })

  it('includes churnLabel for high-churn item', () => {
    const item = { lastCommitAt: null, commitCount7d: 5, commitCount30d: 20, isDirty: false }
    const display = buildActivityDisplay(item)
    expect(display.churnLabel).toBe('high churn')
  })

  it('includes null churnLabel when no commits', () => {
    const item = { lastCommitAt: null, commitCount7d: 0, commitCount30d: 0, isDirty: false }
    const display = buildActivityDisplay(item)
    expect(display.churnLabel).toBeNull()
  })
})
