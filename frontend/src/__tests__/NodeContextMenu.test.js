import { describe, it, expect } from 'vitest'
import { getMenuItems } from '../components/NodeContextMenu'

describe('getMenuItems', () => {
  it('returns empty array for null node', () => {
    expect(getMenuItems(null)).toEqual([])
  })

  it('folder includes "Drill into folder" item', () => {
    const items = getMenuItems({ type: 'folder', path: '/some/folder' })
    const actions = items.filter(i => !i.isDivider).map(i => i.action)
    expect(actions).toContain('drillIn')
  })

  it('file does not include "Open in Dolphin" (files action)', () => {
    const items = getMenuItems({ type: 'file', path: '/some/file.js' })
    const actions = items.filter(i => !i.isDivider).map(i => i.action)
    expect(actions).not.toContain('files')
  })

  it('file menu includes "reveal" action', () => {
    const items = getMenuItems({ type: 'file', path: '/some/file.js' })
    const actions = items.filter(i => !i.isDivider).map(i => i.action)
    expect(actions).toContain('reveal')
  })

  it('both file and folder menus include "copyRelPath" action', () => {
    const fileActions = getMenuItems({ type: 'file', path: '/some/file.js' })
      .filter(i => !i.isDivider).map(i => i.action)
    const folderActions = getMenuItems({ type: 'folder', path: '/some/folder' })
      .filter(i => !i.isDivider).map(i => i.action)
    expect(fileActions).toContain('copyRelPath')
    expect(folderActions).toContain('copyRelPath')
  })
})
