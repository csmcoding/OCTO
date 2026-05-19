import { getActiveSignals } from './signals'

const ALERT_SIGNALS = new Set(['gitDirty', 'gitUnpushed'])

export const THEMES = {
  dark: {
    bg: '#0d1018', fogColor: '#111827', fogDensity: 0.026,
    ambientColor: '#d8e6ff', ambientIntensity: 0.24,
    centerLight: '#6ee7dc', centerLightIntensity: 2.5,
    topLight: '#ffffff', topLightIntensity: 1.0,
    sideLight: '#7aa2ff', sideLightIntensity: 0.45,
    fillLight: '#314a9f', fillLightIntensity: 0.72,
    cellColor: '#1e2040', sectionColor: '#2e3055',
    rimColor: '#a8f0ee', rimPower: 2.5, rimIntensity: 0.88, colorBoost: 0.52,
    snowColor: '#4ecdc4', snowOpacity: 0.35, snowBlending: 'additive',
    tentacleBase: '#0d1320', tentacleEmissiveIdle: 0.10, tentacleEmissiveHover: 0.14,
    tentacleOpacityIdle: 0.58, tentacleOpacityHover: 0.88,
    rippleColor: '#4ecdc4', rippleBlending: 'additive', rippleMaxOpacity: 0.7,
    showStars: true,
    uiBg: 'rgba(6,6,18,0.97)', uiBorder: 'rgba(124,157,245,0.18)',
    uiText: '#e2e2f2', uiTextMuted: 'rgba(160,160,200,0.65)', uiTextFaint: 'rgba(110,110,158,0.5)',
    uiAccent: '#7c9df5', uiActiveRow: 'rgba(78,205,196,0.06)',
  },
  deepspace: {
    bg: '#090b12', fogColor: '#0b1020', fogDensity: 0.038,
    ambientColor: '#b0c8e8', ambientIntensity: 0.18,
    centerLight: '#60c8dc', centerLightIntensity: 2.2,
    topLight: '#e8f0ff', topLightIntensity: 0.85,
    sideLight: '#5080cc', sideLightIntensity: 0.35,
    fillLight: '#1a2860', fillLightIntensity: 0.55,
    cellColor: '#141428', sectionColor: '#202040',
    rimColor: '#8090f0', rimPower: 2.8, rimIntensity: 0.80, colorBoost: 0.50,
    snowColor: '#3080c0', snowOpacity: 0.28, snowBlending: 'additive',
    tentacleBase: '#060812', tentacleEmissiveIdle: 0.08, tentacleEmissiveHover: 0.12,
    tentacleOpacityIdle: 0.50, tentacleOpacityHover: 0.85,
    rippleColor: '#5090d0', rippleBlending: 'additive', rippleMaxOpacity: 0.6,
    showStars: true,
    uiBg: 'rgba(4,4,14,0.97)', uiBorder: 'rgba(100,130,220,0.18)',
    uiText: '#d0d8f0', uiTextMuted: 'rgba(140,160,220,0.65)', uiTextFaint: 'rgba(80,100,180,0.5)',
    uiAccent: '#6080e0', uiActiveRow: 'rgba(60,100,200,0.06)',
  },
  light: {
    bg: '#e8edf5', fogColor: '#c8d4e8', fogDensity: 0.010,
    ambientColor: '#eef2ff', ambientIntensity: 1.10,
    centerLight: '#6ee7dc', centerLightIntensity: 2.0,
    topLight: '#f8faff', topLightIntensity: 0.6,
    sideLight: '#80b0d8', sideLightIntensity: 0.35,
    fillLight: '#6080b0', fillLightIntensity: 0.60,
    cellColor: '#7a8aaa', sectionColor: '#5a6a8a',
    rimColor: '#006080', rimPower: 5.0, rimIntensity: 0.70, colorBoost: 0.68,
    snowColor: '#b0c8e8', snowOpacity: 0.50, snowBlending: 'normal',
    tentacleBase: '#2a3a5a', tentacleEmissiveIdle: 0.06, tentacleEmissiveHover: 0.14,
    tentacleOpacityIdle: 0.50, tentacleOpacityHover: 0.85,
    rippleColor: '#00a8c8', rippleBlending: 'normal', rippleMaxOpacity: 0.5,
    showStars: false,
    uiBg: 'rgba(240,245,252,0.88)', uiBorder: 'rgba(0,100,140,0.14)',
    uiText: '#1a2a3a', uiTextMuted: 'rgba(30,60,100,0.55)', uiTextFaint: 'rgba(30,60,100,0.32)',
    uiAccent: '#006080', uiActiveRow: 'rgba(0,100,140,0.09)',
  },
}

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
  const active = getActiveSignals(node)
  if (active.some(k => ALERT_SIGNALS.has(k))) return PALETTE.signal
  if (node.type === 'folder') return PALETTE.folder
  return PALETTE.file
}
