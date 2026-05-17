export const SIGNAL_COLORS = {
  gitUnpushed: '#ff4444',
  gitDirty: '#ff8800',
  noReadme: '#ffdd00',
  recentlyModified: '#4A90D9',
  dormant: '#555566',
}

export const SIGNAL_LABELS = {
  gitUnpushed: 'Unpushed commits',
  gitDirty: 'Uncommitted changes',
  noReadme: 'No README',
  recentlyModified: 'Recently modified',
  dormant: 'Dormant',
}

export function getActiveSignals(node) {
  const signals = node.signals ?? {}
  return Object.entries(signals)
    .filter(([, active]) => active)
    .map(([key]) => key)
}

export function getDominantColor(node) {
  if (node.dominantColor) return node.dominantColor
  const active = getActiveSignals(node)
  if (active.length === 0) return null
  return SIGNAL_COLORS[active[0]] ?? null
}
