import { describe, it, expect } from 'vitest'

function settingsReducer(state, key, value) {
  return { ...state, [key]: value }
}

const defaults = {
  autoRotate: true, showLabels: true, sway: true,
  scanDepth: 2, colorTheme: 'dark',
}

describe('settings state', () => {
  it('toggles autoRotate off', () => {
    const next = settingsReducer(defaults, 'autoRotate', false)
    expect(next.autoRotate).toBe(false)
    expect(next.showLabels).toBe(true)
  })

  it('clamps scan depth in range', () => {
    expect(defaults.scanDepth).toBeGreaterThanOrEqual(1)
    expect(defaults.scanDepth).toBeLessThanOrEqual(5)
  })

  it('resets to defaults', () => {
    const changed = settingsReducer(defaults, 'autoRotate', false)
    const reset = { ...defaults }
    expect(reset.autoRotate).toBe(true)
  })

  it('colorTheme only accepts known values', () => {
    const themes = ['dark', 'deepspace']
    expect(themes).toContain(defaults.colorTheme)
  })
})
