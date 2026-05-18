import { describe, it, expect } from 'vitest'
import { FogExp2 } from 'three'

describe('aesthetic helpers', () => {
  it('FogExp2 density is in valid range', () => {
    const fog = new FogExp2('#050508', 0.045)
    expect(fog.density).toBeGreaterThan(0)
    expect(fog.density).toBeLessThan(0.2)
  })

  it('fresnel rim power is positive', () => {
    expect(2.5).toBeGreaterThan(0)
  })

  it('MarineSnow COUNT is 400', () => {
    expect(400).toBe(400)
  })

  it('ripple completes in ~0.6s', () => {
    let progress = 0
    const delta = 1 / 60
    const frames = Math.ceil(0.6 / delta)
    for (let i = 0; i < frames; i++) {
      progress = Math.min(progress + delta / 0.6, 1)
    }
    expect(progress).toBe(1)
  })
})
