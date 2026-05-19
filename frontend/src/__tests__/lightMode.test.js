import { describe, it, expect } from 'vitest'
import { THEMES } from '../utils/palette.js'

const REQUIRED_KEYS = [
  'bg', 'fogColor', 'fogDensity',
  'ambientColor', 'ambientIntensity',
  'centerLight', 'centerLightIntensity',
  'rimColor', 'rimPower', 'rimIntensity', 'colorBoost',
  'snowColor', 'snowOpacity', 'snowBlending',
  'tentacleBase',
  'rippleColor', 'rippleBlending', 'rippleMaxOpacity',
  'showStars',
  'uiBg', 'uiBorder', 'uiText', 'uiAccent',
]

describe('THEMES config — coverage', () => {
  it('exports dark, deepspace, and light variants', () => {
    expect(THEMES).toHaveProperty('dark')
    expect(THEMES).toHaveProperty('deepspace')
    expect(THEMES).toHaveProperty('light')
  })

  it('all three themes share the same required keys', () => {
    for (const key of REQUIRED_KEYS) {
      expect(THEMES.dark,      `dark missing ${key}`).toHaveProperty(key)
      expect(THEMES.deepspace, `deepspace missing ${key}`).toHaveProperty(key)
      expect(THEMES.light,     `light missing ${key}`).toHaveProperty(key)
    }
  })
})

describe('THEMES.light — visual identity', () => {
  it('bg is a pearl-blue hex color (starts with #e)', () => {
    expect(THEMES.light.bg).toMatch(/^#[eE]/)
  })

  it('showStars is false (stars invisible on bright scene)', () => {
    expect(THEMES.light.showStars).toBe(false)
  })

  it('dark and deepspace show stars', () => {
    expect(THEMES.dark.showStars).toBe(true)
    expect(THEMES.deepspace.showStars).toBe(true)
  })

  it('snowBlending is "normal" (additive on white = invisible)', () => {
    expect(THEMES.light.snowBlending).toBe('normal')
  })

  it('dark and deepspace use additive blending for snow', () => {
    expect(THEMES.dark.snowBlending).toBe('additive')
    expect(THEMES.deepspace.snowBlending).toBe('additive')
  })

  it('ambientIntensity is much higher than dark (bright observatory)', () => {
    expect(THEMES.light.ambientIntensity).toBeGreaterThan(THEMES.dark.ambientIntensity * 4)
  })

  it('rimColor is the deep-cyan accent #006080', () => {
    expect(THEMES.light.rimColor).toBe('#006080')
  })

  it('colorBoost is higher than dark (more node pigment on bright bg)', () => {
    expect(THEMES.light.colorBoost).toBeGreaterThan(THEMES.dark.colorBoost)
  })

  it('uiText is a dark readable color (not near-white like dark theme)', () => {
    // dark theme uiText is near-white (#e2e2f2); light must be near-dark
    expect(THEMES.light.uiText).toBe('#1a2a3a')
    expect(THEMES.dark.uiText).not.toBe(THEMES.light.uiText)
  })

  it('rippleBlending is "normal" (additive ripple invisible on white bg)', () => {
    expect(THEMES.light.rippleBlending).toBe('normal')
  })
})
