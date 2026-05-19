import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import { Vector3, MathUtils, BufferGeometry, BufferAttribute, FogExp2 } from 'three'
import { loadTree, loadSubtree, openNode } from '../utils/loadTree'
import ChangeRootButton from './ChangeRootButton'
import { exportMarkdown, downloadMarkdown } from '../utils/exportMarkdown'
import { buildTentacleLayout } from '../utils/buildTentacleLayout'
import { useRevealProgress } from '../utils/useAnimationClock'
import { getNodeColor, THEMES } from '../utils/palette'
import { classifyNode, CLUSTERS, summarizeFolderClusters } from '../utils/archClassify'
import Tentacle from './Tentacle'
import NodeMesh from './NodeMesh'
import MarineSnow from './MarineSnow'
import HoverRipple from './HoverRipple'
import Panel from './Panel'
import BackToProjectsButton from './BackToProjectsButton'
import Breadcrumb from './Breadcrumb'
import NodeTooltip from './NodeTooltip'
import SearchPanel from './SearchPanel'
import NodeContextMenu from './NodeContextMenu'
import Minimap from './Minimap'
import PinTray from './PinTray'
import SettingsPanel from './SettingsPanel'
import ActivityLegend from './ActivityLegend'
import ArchLegend from './ArchLegend'
import { loadActivity } from '../utils/loadActivity'
import { getNodeActivity, aggregateFolderActivity, getActivityLevel, computeActivitySummary, computeActivityLevelCounts } from '../utils/activityAggregate'

function CameraRig({ hoveredPosition, autoRotate, onCameraMove }) {
  const { camera, size } = useThree()
  const base = useRef({ theta: 0 })
  const spring = useRef({ x: 0, y: 4, z: 10 })
  const lookTarget = useRef(new Vector3(0, 0, 0))
  const rRef = useRef(10)
  const zoomRef = useRef(1.0)
  const tiltRef = useRef(0)
  const touchDraggingRef = useRef(false)
  const lastCbRef = useRef(0)

  useEffect(() => {
    rRef.current = size.width < 900 ? 13 : 10
  }, [size.width])

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1.08 : 0.93
      zoomRef.current = Math.min(3.5, Math.max(0.45, zoomRef.current * delta))
    }

    let lastPinchDist = null
    let lastTouchX = null
    let lastTouchY = null
    let touchHasMoved = false

    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX
        lastTouchY = e.touches[0].clientY
        touchHasMoved = false
      }
    }
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.hypot(dx, dy)
        if (lastPinchDist !== null) {
          const ratio = dist / lastPinchDist
          const delta = ratio > 1 ? 0.95 : 1.05
          zoomRef.current = Math.min(3.5, Math.max(0.45, zoomRef.current * delta))
        }
        lastPinchDist = dist
      } else if (e.touches.length === 1 && lastTouchX !== null) {
        const dx = e.touches[0].clientX - lastTouchX
        const dy = e.touches[0].clientY - lastTouchY
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) touchHasMoved = true
        if (touchHasMoved) {
          e.preventDefault()
          base.current.theta -= dx * 0.008
          tiltRef.current = Math.max(-3, Math.min(5, tiltRef.current - dy * 0.018))
          touchDraggingRef.current = true
        }
        lastTouchX = e.touches[0].clientX
        lastTouchY = e.touches[0].clientY
      }
    }
    const onTouchEnd = () => {
      lastPinchDist = null; lastTouchX = null; lastTouchY = null
      touchHasMoved = false; touchDraggingRef.current = false
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useFrame((_, delta) => {
    if (autoRotate && !touchDraggingRef.current) base.current.theta += delta * 0.08

    const baseR = rRef.current * zoomRef.current
    let tx = Math.sin(base.current.theta) * baseR
    let ty = (4 + tiltRef.current) * zoomRef.current
    let tz = Math.cos(base.current.theta) * baseR

    if (hoveredPosition) {
      tx += hoveredPosition.x * 0.08
      ty += hoveredPosition.y * 0.08
      tz += hoveredPosition.z * 0.08
    }

    const k = 1 - Math.exp(-delta * 2.5)
    spring.current.x = MathUtils.lerp(spring.current.x, tx, k)
    spring.current.y = MathUtils.lerp(spring.current.y, ty, k)
    spring.current.z = MathUtils.lerp(spring.current.z, tz, k)

    camera.position.set(spring.current.x, spring.current.y, spring.current.z)
    camera.lookAt(lookTarget.current)

    if (onCameraMove) {
      const now = performance.now()
      if (now - lastCbRef.current > 50) {
        onCameraMove({ x: spring.current.x, y: spring.current.y, z: spring.current.z })
        lastCbRef.current = now
      }
    }
  })

  return null
}

function StarField() {
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    const count = 280
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 30 + Math.random() * 20
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    g.setAttribute('position', new BufferAttribute(pos, 3))
    return g
  }, [])

  return (
    <points geometry={geo}>
      <pointsMaterial color="#8888cc" size={0.06} sizeAttenuation transparent opacity={0.4} />
    </points>
  )
}

function KeyboardLegend({ colorTheme = 'dark', activityMode = false, archMode = false }) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const btnRef = useRef(null)
  const isLight = colorTheme === 'light'
  const btnBg      = isLight ? 'rgba(235,242,252,0.88)' : 'rgba(10,10,28,0.88)'
  const btnBorder  = isLight ? 'rgba(0,96,128,0.3)'    : 'rgba(124,157,245,0.45)'
  const btnColor   = isLight ? '#3a5070'               : '#a0a8d0'
  const btnHovBdr  = isLight ? 'rgba(0,96,128,0.7)'    : 'rgba(124,157,245,0.8)'
  const btnHovClr  = isLight ? '#006080'               : '#e2e2f2'
  const panelBg    = isLight ? 'rgba(240,245,252,0.97)' : 'rgba(6,6,18,0.97)'
  const panelBdr   = isLight ? 'rgba(0,96,128,0.14)'   : 'rgba(124,157,245,0.18)'
  const kbdColor   = isLight ? '#006080'               : '#7c9df5'
  const kbdBg      = isLight ? 'rgba(0,96,128,0.08)'   : 'rgba(124,157,245,0.1)'
  const kbdBdr     = isLight ? 'rgba(0,96,128,0.18)'   : 'rgba(124,157,245,0.22)'
  const labelColor = isLight ? 'rgba(30,60,100,0.75)'  : 'rgba(200,200,230,0.7)'
  const shortcuts = [
    ['⌘K',        'Search nodes'],
    ['S',         'Settings'],
    ['R',         'Rescan'],
    ['T',         'Activity mode'],
    ['A',         'Architecture mode'],
    ['O',         'Change directory'],
    ['Enter',     'Open selected'],
    ['Backspace', 'Go up one level'],
    ['Esc',       'Close / deselect'],
    ['Scroll',    'Zoom in / out'],
  ]

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const panelH = 310
      const panelW = 240
      const x = Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8))
      const y = Math.max(8, rect.top - panelH - 8)
      setPanelPos({ x, y })
    }
    setOpen(v => !v)
  }

  return (
    <div style={{ position: 'fixed', bottom: 54, left: 20, zIndex: 90 }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        style={{
          background: btnBg,
          border: `1px solid ${btnBorder}`,
          borderRadius: '50%',
          width: 32, height: 32,
          color: btnColor,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = btnHovBdr
          e.currentTarget.style.color = btnHovClr
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = btnBorder
          e.currentTarget.style.color = btnColor
        }}
      >?</button>

      {open && (
        <div style={{
          position: 'fixed',
          left: panelPos.x,
          top: panelPos.y,
          background: panelBg,
          border: `1px solid ${panelBdr}`,
          borderRadius: 10,
          backdropFilter: 'blur(16px)',
          padding: '10px 14px',
          minWidth: 220,
          animation: 'fadeIn 0.15s ease',
          zIndex: 91,
        }}>
          {/* LENSES section */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: kbdColor, opacity: 0.7, marginBottom: 5,
          }}>Lenses</div>
          {[
            ['Filesystem',    'explore structure',   null      ],
            ['Architecture',  'code roles  [A]',     '#a78bfa' ],
            ['Activity',      'git recency  [T]',    '#ff6b35' ],
          ].map(([name, desc, color]) => {
            const isActive = (name === 'Activity' && activityMode)
              || (name === 'Architecture' && archMode)
              || (name === 'Filesystem' && !activityMode && !archMode)
            return (
              <div key={name} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 12, padding: '2px 0',
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: isActive ? (color ?? kbdColor) : labelColor,
                  fontWeight: isActive ? 700 : 400,
                  whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {isActive && (
                    <span style={{ fontSize: 6, color: color ?? kbdColor }}>●</span>
                  )}
                  {name}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: isActive ? (isLight ? 'rgba(30,30,60,0.6)' : 'rgba(200,200,230,0.55)') : 'rgba(140,140,180,0.38)',
                  textAlign: 'right', whiteSpace: 'nowrap',
                }}>{desc}</span>
              </div>
            )
          })}
          <div style={{ borderTop: `1px solid ${panelBdr}`, margin: '7px 0 5px' }} />

          {/* SHORTCUTS section */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: kbdColor, opacity: 0.7, marginBottom: 5,
          }}>Shortcuts</div>
          {shortcuts.map(([key, label]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: 16, padding: '3px 0',
            }}>
              <kbd style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: kbdColor,
                background: kbdBg,
                border: `1px solid ${kbdBdr}`,
                borderRadius: 4, padding: '1px 6px',
                whiteSpace: 'nowrap',
              }}>{key}</kbd>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: labelColor,
                textAlign: 'right',
              }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ZoomHint({ colorTheme = 'dark' }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  const isLight = colorTheme === 'light'
  return (
    <div style={{
      position: 'fixed', bottom: 52, right: 20,
      color: isLight ? 'rgba(30,60,100,0.65)' : 'rgba(180,185,230,0.85)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, letterSpacing: '0.08em',
      background: isLight ? 'rgba(235,242,252,0.92)' : 'rgba(6,6,18,0.82)',
      border: `1px solid ${isLight ? 'rgba(0,96,128,0.18)' : 'rgba(124,157,245,0.18)'}`,
      borderRadius: 8,
      padding: '6px 10px',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.4s ease, fadeOut 0.6s ease 2.9s forwards',
      pointerEvents: 'none', userSelect: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      gap: 3,
    }}>
      <span>scroll  ↕  zoom</span>
      <span>click  ·  select</span>
      <span>dblclick  ·  enter</span>
    </div>
  )
}

function OverflowBadge({ total, visible, colorTheme = 'dark' }) {
  if (!total || total <= visible) return null
  const isLight = colorTheme === 'light'
  return (
    <div style={{
      position: 'fixed',
      top: 52,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 80,
      background: isLight ? 'rgba(235,242,252,0.92)' : 'rgba(6,6,18,0.88)',
      border: `1px solid ${isLight ? 'rgba(160,80,0,0.2)' : 'rgba(200,140,60,0.35)'}`,
      borderRadius: 20,
      padding: '3px 12px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9,
      color: isLight ? 'rgba(140,70,0,0.8)' : 'rgba(200,160,80,0.75)',
      letterSpacing: '0.06em',
      pointerEvents: 'none',
      backdropFilter: 'blur(8px)',
      whiteSpace: 'nowrap',
    }}>
      showing {visible} of {total} nodes — use scan depth to narrow scope
    </div>
  )
}

function SceneBackground({ colorTheme }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    const t = THEMES[colorTheme] ?? THEMES.dark
    gl.setClearColor(t.bg, 1)
    scene.fog = new FogExp2(t.fogColor, t.fogDensity)
    return () => { scene.fog = null }
  }, [colorTheme, gl, scene])
  return null
}

function AnimatedFillLight({ color = '#314a9f', intensity = 0.72 }) {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.getElapsedTime() * 0.12
    lightRef.current.position.set(Math.sin(t) * 9, 3, Math.cos(t) * 9)
  })
  return (
    <pointLight ref={lightRef} intensity={intensity} color={color} distance={22} decay={2} />
  )
}

const SCENE_NODE_CAP = 80

function SceneObjects({
  currentRoot, parentNode, ringKey, selectedNodeId,
  onNodeClick, onNodeDoubleClick, onNodeContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
  onHoverPosition,
  hoveredId, onHoveredChange, onLayoutReady, onCapInfo,
  showLabels, sway, colorTheme,
  activityMode, activityIndex,
  archMode = false,
}) {
  const children = currentRoot?.children ?? []
  const isCapped = children.length > SCENE_NODE_CAP
  const visibleChildren = useMemo(
    () => isCapped ? children.slice(0, SCENE_NODE_CAP) : children,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, isCapped],
  )
  const nodeCount = visibleChildren.length
  const radius = Math.max(3.8, Math.min(6.0, nodeCount * 0.28 + 3.0))

  const layout = useMemo(
    () => buildTentacleLayout(visibleChildren, radius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleChildren, radius],
  )

  useEffect(() => { onLayoutReady?.(layout) }, [layout, onLayoutReady])
  useEffect(() => {
    onCapInfo?.({ capped: isCapped, total: children.length, visible: nodeCount })
  }, [isCapped, children.length, nodeCount, onCapInfo])

  const handlePointerLeave = useCallback(() => {
    onHoveredChange(null)
    onHoverPosition?.(null)
    onPointerLeave?.()
  }, [onHoveredChange, onHoverPosition, onPointerLeave])

  const handlePointerMove = useCallback(
    (node, e) => onPointerMove?.(node, e),
    [onPointerMove],
  )

  const revealProgress = useRevealProgress(ringKey, 1200)

  const centerRef = useRef()
  useFrame(({ clock }) => {
    if (!centerRef.current) return
    const t = clock.getElapsedTime()
    const scale = 1 + Math.sin(t * (Math.PI * 2 / 3.5)) * 0.03
    centerRef.current.scale.setScalar(scale)
  })

  const theme = THEMES[colorTheme] ?? THEMES.dark

  return (
    <group>
      {theme.showStars && <StarField />}
      <MarineSnow sway={sway} colorTheme={colorTheme} />
      <Grid
        position={[0, -6, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.3}
        cellColor={theme.cellColor}
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor={theme.sectionColor}
        fadeDistance={20}
        fadeStrength={2}
        infiniteGrid
      />

      <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />
      <pointLight position={[0, 0, 0]}  intensity={theme.centerLightIntensity} color={theme.centerLight} distance={15} decay={2} />
      <pointLight position={[0, 10, 2]} intensity={theme.topLightIntensity} color={theme.topLight} distance={26} decay={2} />
      <pointLight position={[-8, 4, -6]} intensity={theme.sideLightIntensity} color={theme.sideLight} distance={22} decay={2} />
      <AnimatedFillLight color={theme.fillLight} intensity={theme.fillLightIntensity} />

      {parentNode && (
        <mesh position={[0, 0, 3]} scale={[0.5, 0.5, 0.5]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={getNodeColor(parentNode)}
            emissive={getNodeColor(parentNode)}
            emissiveIntensity={0.1}
            opacity={0.25}
            transparent
          />
        </mesh>
      )}

      <mesh ref={centerRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#1a1a2e"
          emissive="#ffffff"
          emissiveIntensity={0.18}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {layout.map(({ node, endPosition, curve, basePoints }, i) => {
        const isHovered = hoveredId === node.id
        const archColor = archMode ? (CLUSTERS[classifyNode(node).cluster]?.color ?? null) : null
        const color = archColor ?? getNodeColor(node)
        const delay = i * 0.045
        const activityItem = activityMode && activityIndex
          ? (node.type === 'folder'
              ? aggregateFolderActivity(node, activityIndex)
              : (activityIndex[node.path] ?? null))
          : null
        const activityLevel = activityItem ? getActivityLevel(activityItem) : null
        return (
          <group key={node.id}>
            <Tentacle
              curve={curve}
              basePoints={basePoints}
              index={i}
              color={color}
              hovered={isHovered}
              nodeCount={nodeCount}
              sway={sway}
              colorTheme={colorTheme}
            />
            <NodeMesh
              node={node}
              position={[endPosition.x, endPosition.y, endPosition.z]}
              onClick={onNodeClick}
              onDoubleClick={onNodeDoubleClick}
              onContextMenu={onNodeContextMenu}
              revealProgress={revealProgress}
              delay={delay}
              isSelected={selectedNodeId === node.id}
              isDimmed={selectedNodeId != null && selectedNodeId !== node.id}
              showLabel={showLabels && hoveredId !== node.id}
              index={i}
              activityMode={activityMode}
              activityLevel={activityLevel}
              isActivityDirty={activityItem?.isDirty ?? false}
              colorTheme={colorTheme}
              archColor={archColor}
              onPointerEnter={(n, e) => {
                onHoveredChange(node.id)
                onHoverPosition?.(endPosition)
                onPointerEnter?.(n, e)
              }}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
            />
          </group>
        )
      })}
    </group>
  )
}

function flattenTree(root) {
  if (!root) return []
  const nodes = []
  const walk = (node) => { nodes.push(node); node.children?.forEach(walk) }
  walk(root)
  return nodes
}

function findAncestorStack(root, targetPath) {
  if (!root) return null
  if (root.path === targetPath) return [root]
  if (!root.children) return null
  for (const child of root.children) {
    const sub = findAncestorStack(child, targetPath)
    if (sub) return [root, ...sub]
  }
  return null
}

export default function ThreeScene({ treeData, onLoadingChange, rootPath, onChangeRoot }) {
  const [navStack, setNavStack] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredEndPos, setHoveredEndPos] = useState(null)
  const [tooltip, setTooltip] = useState({ node: null, x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState({ node: null, x: 0, y: 0 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [layout, setLayout] = useState([])
  const [hoveredId, setHoveredId] = useState(null)
  const [pins, setPins] = useState([])
  const [settings, setSettings] = useState({
    autoRotate:   true,
    showLabels:   true,
    sway:         true,
    scanDepth:    2,
    colorTheme:   'dark',
    activityMode: false,
    archMode:     false,
  })
  const [activityData, setActivityData] = useState(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [capInfo, setCapInfo] = useState(null)
  const [cameraPos, setCameraPos] = useState(null)
  const [minimapCollapsed, setMinimapCollapsed] = useState(false)
  const setSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))
  const scanDepthRef = useRef(2)
  scanDepthRef.current = settings.scanDepth
  const activityModeRef = useRef(false)
  activityModeRef.current = settings.activityMode
  const archModeRef = useRef(false)
  archModeRef.current = settings.archMode
  const originalRootRef = useRef(null)
  const navStackRef = useRef([])
  navStackRef.current = navStack

  const currentRoot = navStack[navStack.length - 1] ?? null
  const parentNode = navStack[navStack.length - 2] ?? null

  useEffect(() => {
    setNavStack([])
    setSelectedNode(null)
    const h = window.location.hash
    const hashPath = h.startsWith('#p=') ? decodeURIComponent(h.slice(3)) : null
    const loader = rootPath ? loadSubtree(rootPath, 2) : loadTree(2)
    loader.then(data => {
      originalRootRef.current = data
      if (!rootPath && hashPath) {
        const stack = findAncestorStack(data, hashPath)
        if (stack?.length) { setNavStack(stack); return }
      }
      setNavStack([data])
    }).catch(console.error)
  }, [rootPath])

  useEffect(() => {
    if (treeData) {
      setNavStack([treeData])
      setSelectedNode(null)
      originalRootRef.current = treeData
    }
  }, [treeData])

  const [revealKey, setRevealKey] = useState(0)
  useEffect(() => {
    if (currentRoot) setRevealKey(k => k + 1)
  }, [currentRoot])

  // Load activity data when mode is on or root changes while mode is on
  useEffect(() => {
    if (!settings.activityMode || !currentRoot?.path) return
    if (activityData?.root === currentRoot.path) return  // already loaded
    loadActivity(currentRoot.path)
      .then(data => setActivityData(data))
      .catch(err => {
        console.warn('[octo] activity load failed', err)
        setActivityData({ byPath: {}, unavailable: 'fetch_error', root: currentRoot.path })
      })
  }, [settings.activityMode, currentRoot?.path, activityData?.root])

  // Reset activity data when root changes
  useEffect(() => {
    setActivityData(null)
  }, [currentRoot?.path])

  useEffect(() => {
    if (!navStack.length) return
    const path = navStack[navStack.length - 1].path
    const hash = path ? '#p=' + encodeURIComponent(path) : ''
    window.history.replaceState(null, '', hash || window.location.pathname)
  }, [navStack])

  const handleRescan = useCallback(async () => {
    onLoadingChange(true)
    try {
      const stack = navStackRef.current
      const root = stack[stack.length - 1]
      if (root?.path && stack.length > 1) {
        const fresh = await loadSubtree(root.path, scanDepthRef.current)
        setNavStack(prev => [...prev.slice(0, -1), fresh])
      } else {
        const fresh = await loadTree(scanDepthRef.current)
        originalRootRef.current = fresh
        setNavStack([fresh])
      }
    } catch (e) {
      console.error('rescan failed', e)
    }
    onLoadingChange(false)
  }, [onLoadingChange])

  const handleDrillIn = useCallback(async (node) => {
    let target = node
    if (node.hasChildren && node.children.length === 0) {
      onLoadingChange(true)
      try {
        target = await loadSubtree(node.path, scanDepthRef.current)
      } catch (e) {
        console.error('subtree load failed', e)
        onLoadingChange(false)
        return
      }
      onLoadingChange(false)
    }
    setNavStack(prev => [...prev, target])
    setSelectedNode(null)
  }, [onLoadingChange])

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  const handleNodeDoubleClick = useCallback(async (node) => {
    if (node.type === 'folder') {
      await handleDrillIn(node)
    } else {
      openNode(node.path, 'editor').catch(console.error)
    }
  }, [handleDrillIn])

  const handleSearchSelect = useCallback((node) => {
    const fullStack = findAncestorStack(originalRootRef.current, node.path)
    if (fullStack && fullStack.length > 1) {
      setNavStack(fullStack.slice(0, -1))
    } else {
      setNavStack([originalRootRef.current])
    }
    setSelectedNode(node)
    setSearchOpen(false)
  }, [])

  const handleSearchDrillToNode = useCallback(async (node) => {
    if (node.type === 'folder') {
      await handleDrillIn(node)
    } else {
      handleSearchSelect(node)
    }
    setSearchOpen(false)
  }, [handleDrillIn, handleSearchSelect])

  // Flat node list for search — recomputed when navStack changes (tree load/rescan)
  const flatNodes = useMemo(
    () => flattenTree(originalRootRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navStack],
  )

  const handleCameraMove = useCallback(({ x, y, z }) => {
    setCameraPos({ x, y, z })
  }, [])

  // Activity data for the selected node (file or aggregated folder)
  const selectedActivityItem = useMemo(() => {
    if (!settings.activityMode || !activityData?.byPath || !selectedNode) return null
    return selectedNode.type === 'folder'
      ? aggregateFolderActivity(selectedNode, activityData.byPath)
      : getNodeActivity(selectedNode, activityData.byPath)
  }, [settings.activityMode, activityData, selectedNode])

  // Scene-wide summary line
  const activitySummary = useMemo(() => {
    if (!settings.activityMode || !activityData?.byPath) return null
    const nodes = layout.map(e => e.node)
    return computeActivitySummary(nodes, activityData.byPath)
  }, [settings.activityMode, activityData, layout])

  // Per-level counts for ActivityLegend
  const activityLevelCounts = useMemo(() => {
    if (!settings.activityMode || !activityData?.byPath) return null
    const nodes = layout.map(e => e.node)
    return computeActivityLevelCounts(nodes, activityData.byPath)
  }, [settings.activityMode, activityData, layout])

  const handlePin = useCallback((node) => {
    setPins(prev => prev.some(p => p.id === node.id) ? prev : [...prev, node])
  }, [])

  const handleUnpin = useCallback((node) => {
    setPins(prev => prev.filter(p => p.id !== node.id))
  }, [])

  const handleJump = useCallback((node) => {
    const fullStack = findAncestorStack(originalRootRef.current, node.path)
    if (fullStack && fullStack.length > 1) {
      setNavStack(node.type === 'folder' ? fullStack : fullStack.slice(0, -1))
    } else {
      setNavStack([originalRootRef.current])
    }
    setSelectedNode(node)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
        return
      }

      if (e.key === 'Escape') {
        if (settingsOpen) { setSettingsOpen(false); return }
        if (searchOpen)   { setSearchOpen(false);   return }
        if (selectedNode) { setSelectedNode(null);  return }
        return
      }

      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey) {
        setSettingsOpen(v => !v)
        return
      }

      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        handleRescan()
        return
      }

      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) {
        const next = !activityModeRef.current
        setSettings(prev => ({ ...prev, activityMode: next, ...(next ? { archMode: false } : {}) }))
        return
      }

      if ((e.key === 'a' || e.key === 'A') && !e.metaKey && !e.ctrlKey) {
        const next = !archModeRef.current
        setSettings(prev => ({ ...prev, archMode: next, ...(next ? { activityMode: false } : {}) }))
        return
      }

      if ((e.key === 'o' || e.key === 'O') && !e.metaKey && !e.ctrlKey) {
        onChangeRoot?.()
        return
      }

      if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && !e.metaKey && !e.ctrlKey) {
        if (parentNode) {
          setNavStack(prev => prev.slice(0, -1))
          setSelectedNode(null)
        }
        return
      }

      if (e.key === 'Enter' && selectedNode) {
        handleNodeDoubleClick(selectedNode)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settingsOpen, searchOpen, selectedNode, parentNode, handleNodeDoubleClick, handleRescan, onChangeRoot])

  const showBack = navStack.length > 1
  const isLight = settings.colorTheme === 'light'
  const chromeBg     = isLight ? 'rgba(235,242,252,0.88)' : 'rgba(10,10,28,0.88)'
  const chromeBdr    = isLight ? 'rgba(0,96,128,0.28)'    : 'rgba(124,157,245,0.45)'
  const chromeColor  = isLight ? '#3a5070'                : '#a0a8d0'
  const chromeHovBdr = isLight ? 'rgba(0,96,128,0.65)'    : 'rgba(124,157,245,0.8)'
  const chromeHovClr = isLight ? '#006080'                : '#e2e2f2'

  return (
    <>
      <Breadcrumb
        navStack={navStack}
        onCrumbClick={(idx) => setNavStack(prev => prev.slice(0, idx + 1))}
        colorTheme={settings.colorTheme}
      />
      <div
        style={{ width: '100%', height: '100%' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas
          onCreated={({ gl }) => {
            gl.setClearColor('#03030a', 1)
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
          }}
          camera={{ position: [0, 4, 10], fov: 62, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          resize={{ debounce: 50 }}
        >
          <SceneBackground colorTheme={settings.colorTheme} />
          <CameraRig hoveredPosition={hoveredEndPos} autoRotate={settings.autoRotate} onCameraMove={handleCameraMove} />
          <HoverRipple position={hoveredEndPos} colorTheme={settings.colorTheme} />
          {currentRoot && (
            <SceneObjects
              currentRoot={currentRoot}
              parentNode={parentNode}
              ringKey={revealKey}
              selectedNodeId={selectedNode?.id}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onNodeContextMenu={(node, e) => {
                const MENU_W = 180
                const MENU_H = 160
                setContextMenu({
                  node,
                  x: Math.max(8, Math.min(e.clientX, window.innerWidth  - MENU_W - 8)),
                  y: Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8)),
                })
              }}
              onPointerEnter={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerMove={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerLeave={() => setTooltip({ node: null, x: 0, y: 0 })}
              onHoverPosition={setHoveredEndPos}
              hoveredId={hoveredId}
              onHoveredChange={setHoveredId}
              onLayoutReady={setLayout}
              onCapInfo={setCapInfo}
              showLabels={settings.showLabels}
              sway={settings.sway}
              colorTheme={settings.colorTheme}
              activityMode={settings.activityMode}
              activityIndex={activityData?.byPath ?? null}
              archMode={settings.archMode}
            />
          )}
        </Canvas>
      </div>
      <ZoomHint colorTheme={settings.colorTheme} />
      {capInfo?.capped && (
        <OverflowBadge total={capInfo.total} visible={capInfo.visible} colorTheme={settings.colorTheme} />
      )}
      {onChangeRoot && <ChangeRootButton onClick={onChangeRoot} />}
      <button
        onClick={() => setSettingsOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 94,
          left: 20,
          zIndex: 90,
          width: 32, height: 32,
          borderRadius: '50%',
          background: settingsOpen
            ? (isLight ? 'rgba(0,96,128,0.12)' : 'rgba(124,157,245,0.15)')
            : chromeBg,
          border: `1px solid ${settingsOpen ? chromeHovBdr : chromeBdr}`,
          color: settingsOpen ? chromeHovClr : chromeColor,
          fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          if (!settingsOpen) {
            e.currentTarget.style.borderColor = chromeHovBdr
            e.currentTarget.style.color = chromeHovClr
          }
        }}
        onMouseLeave={e => {
          if (!settingsOpen) {
            e.currentTarget.style.borderColor = chromeBdr
            e.currentTarget.style.color = chromeColor
          }
        }}
        aria-label="Settings"
        title="Settings"
      >⚙</button>
      <button
        onClick={() => {
          const md = exportMarkdown({ currentRoot, navStack, pins })
          downloadMarkdown(md)
        }}
        style={{
          position: 'fixed',
          bottom: 134,
          left: 20,
          zIndex: 90,
          width: 32, height: 32,
          borderRadius: '50%',
          background: chromeBg,
          border: `1px solid ${chromeBdr}`,
          color: chromeColor,
          fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = chromeHovBdr
          e.currentTarget.style.color = chromeHovClr
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = chromeBdr
          e.currentTarget.style.color = chromeColor
        }}
        aria-label="Export markdown"
        title="Export snapshot (.md)"
      >↓</button>
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href).then(() => {
            setShareCopied(true)
            setTimeout(() => setShareCopied(false), 2000)
          }).catch(() => {})
        }}
        style={{
          position: 'fixed',
          bottom: 174,
          left: 20,
          zIndex: 90,
          width: 32, height: 32,
          borderRadius: '50%',
          background: shareCopied ? (isLight ? 'rgba(0,96,128,0.12)' : 'rgba(78,205,196,0.15)') : chromeBg,
          border: `1px solid ${shareCopied ? (isLight ? 'rgba(0,96,128,0.5)' : 'rgba(78,205,196,0.6)') : chromeBdr}`,
          color: shareCopied ? (isLight ? '#006080' : '#4ecdc4') : chromeColor,
          fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          if (!shareCopied) {
            e.currentTarget.style.borderColor = chromeHovBdr
            e.currentTarget.style.color = chromeHovClr
          }
        }}
        onMouseLeave={e => {
          if (!shareCopied) {
            e.currentTarget.style.borderColor = chromeBdr
            e.currentTarget.style.color = chromeColor
          }
        }}
        aria-label="Copy share link"
        title="Copy share link"
      >{shareCopied ? '✓' : '⬡'}</button>
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          setSetting={setSetting}
          onClose={() => setSettingsOpen(false)}
          onRescan={handleRescan}
        />
      )}
      <KeyboardLegend
        colorTheme={settings.colorTheme}
        activityMode={settings.activityMode}
        archMode={settings.archMode}
      />
      {settings.activityMode && (
        <ActivityLegend
          summary={activitySummary}
          unavailable={activityData?.unavailable ?? null}
          levelCounts={activityLevelCounts}
          colorTheme={settings.colorTheme}
        />
      )}
      {settings.archMode && (
        <ArchLegend
          summary={currentRoot ? summarizeFolderClusters(currentRoot) : null}
          colorTheme={settings.colorTheme}
        />
      )}
      <Minimap
        nodes={layout}
        selectedNodeId={selectedNode?.id}
        hoveredNodeId={hoveredId}
        currentRoot={currentRoot}
        cameraPosition={cameraPos}
        onJumpToNode={setSelectedNode}
        collapsed={minimapCollapsed}
        onToggleCollapsed={() => setMinimapCollapsed(v => !v)}
        colorTheme={settings.colorTheme}
        activityMode={settings.activityMode}
        activityIndex={settings.activityMode ? (activityData?.byPath ?? null) : null}
        archMode={settings.archMode}
      />
      <PinTray pins={pins} onJump={handleJump} onUnpin={handleUnpin} colorTheme={settings.colorTheme} />
      <NodeTooltip
        node={tooltip.node}
        x={tooltip.x}
        y={tooltip.y}
        activityLevel={
          tooltip.node && settings.activityMode && activityData?.byPath
            ? getActivityLevel(
                tooltip.node.type === 'folder'
                  ? aggregateFolderActivity(tooltip.node, activityData.byPath)
                  : (activityData.byPath[tooltip.node.path] ?? null)
              )
            : null
        }
      />
      {selectedNode && (
        <Panel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          isPinned={pins.some(p => p.id === selectedNode?.id)}
          onPin={() => handlePin(selectedNode)}
          onUnpin={() => handleUnpin(selectedNode)}
          onDrillIn={handleDrillIn}
          onRescan={handleRescan}
          onExport={() => { const md = exportMarkdown({ currentRoot, navStack, pins }); downloadMarkdown(md) }}
          depth={navStack.length}
          rootPath={currentRoot?.path}
          activityMode={settings.activityMode}
          activityItem={selectedActivityItem}
          colorTheme={settings.colorTheme}
          archMode={settings.archMode}
        />
      )}
      {showBack && (
        <BackToProjectsButton
          visible={true}
          colorTheme={settings.colorTheme}
          onReset={() => {
            setNavStack([originalRootRef.current])
            setSelectedNode(null)
          }}
        />
      )}
      {contextMenu.node && (
        <NodeContextMenu
          node={contextMenu.node}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu({ node: null, x: 0, y: 0 })}
          onDrillIn={(node) => {
            setContextMenu({ node: null, x: 0, y: 0 })
            handleDrillIn(node)
          }}
          isPinned={pins.some(p => p.id === contextMenu.node?.id)}
          onPinToggle={() => {
            const n = contextMenu.node
            pins.some(p => p.id === n.id) ? handleUnpin(n) : handlePin(n)
          }}
          rootPath={currentRoot?.path}
          colorTheme={settings.colorTheme}
        />
      )}
      <SearchPanel
        open={searchOpen}
        nodes={flatNodes}
        currentRoot={currentRoot}
        onClose={() => setSearchOpen(false)}
        onSelectNode={handleSearchSelect}
        onDrillToNode={handleSearchDrillToNode}
        colorTheme={settings.colorTheme}
        activityIndex={settings.activityMode ? (activityData?.byPath ?? null) : null}
        archMode={settings.archMode}
      />
    </>
  )
}
