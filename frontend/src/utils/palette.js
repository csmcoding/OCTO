export const PALETTE = {
  // Scene backgrounds
  void:          '#03030a',
  voidMid:       '#060610',
  voidSurface:   '#0a0a1a',

  // Node types
  folder:        '#c8a2ff',
  file:          '#4ecdc4',
  signal:        '#ff6b6b',
  selected:      '#f9e94e',
  center:        '#ffffff',

  // UI chrome
  accent:        '#7c9df5',
  accentDim:     'rgba(124,157,245,0.22)',
  text:          '#e2e2f2',
  textMuted:     '#6e6e9e',
  textFaint:     '#3a3a5e',

  // Status
  success:       '#3dffa0',
  warning:       '#ffb830',
  danger:        '#ff4466',
}

export function getNodeColor(node) {
  if (node.dominantSignal) return PALETTE.signal
  if (node.type === 'folder') return PALETTE.folder
  return PALETTE.file
}
