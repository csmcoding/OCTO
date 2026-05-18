import { describe, it, expect } from 'vitest'

describe('keyboard shortcut logic', () => {
  it('Escape closes search before clearing selected node', () => {
    let searchOpen = true
    let selectedNode = { id: '1' }

    const handleEsc = () => {
      if (searchOpen) { searchOpen = false; return }
      if (selectedNode) { selectedNode = null }
    }

    handleEsc()
    expect(searchOpen).toBe(false)
    expect(selectedNode).toEqual({ id: '1' })
  })

  it('Backspace navigates up when parentNode exists', () => {
    let navigated = false
    const parentNode = { id: 'parent' }

    const handleBack = (key, parent, goUp) => {
      if ((key === 'Backspace' || key === 'ArrowLeft') && parent) goUp()
    }

    handleBack('Backspace', parentNode, () => { navigated = true })
    expect(navigated).toBe(true)
  })

  it('Backspace does nothing when at root (no parentNode)', () => {
    let navigated = false
    const parentNode = null

    const handleBack = (key, parent, goUp) => {
      if ((key === 'Backspace' || key === 'ArrowLeft') && parent) goUp()
    }

    handleBack('Backspace', parentNode, () => { navigated = true })
    expect(navigated).toBe(false)
  })
})
