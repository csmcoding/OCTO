import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import { Vector3, MathUtils, BufferGeometry, BufferAttribute } from 'three'
import { loadTree, loadSubtree, openNode } from '../utils/loadTree'
import { buildTentacleLayout } from '../utils/buildTentacleLayout'
import { useRevealProgress } from '../utils/useAnimationClock'
import { getNodeColor } from '../utils/palette'
import Tentacle from './Tentacle'
import NodeMesh from './NodeMesh'
import Panel from './Panel'
import BackToProjectsButton from './BackToProjectsButton'
import Breadcrumb from './Breadcrumb'
import NodeTooltip from './NodeTooltip'
import NodeSearch from './NodeSearch'
import NodeContextMenu from './NodeContextMenu'
import Minimap from './Minimap'
import PinTray from './PinTray'
import SettingsPanel from './SettingsPanel'

function CameraRig({ hoveredPosition, autoRotate }) {
  const { camera, size } = useThree()
  const base = useRef({ theta: 0 })
  const spring = useRef({ x: 0, y: 4, z: 10 })
  const lookTarget = useRef(new Vector3(0, 0, 0))
  const rRef = useRef(10)
  const zoomRef = useRef(1.0)

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
    const onTouchMove = (e) => {
      if (e.touches.length !== 2) return
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
    }
    const onTouchEnd = () => { lastPinchDist = null }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  useFrame((_, delta) => {
    if (autoRotate) base.current.theta += delta * 0.08

    const baseR = rRef.current * zoomRef.current
    let tx = Math.sin(base.current.theta) * baseR
    let ty = 4 * zoomRef.current
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

function KeyboardLegend() {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 })
  const btnRef = useRef(null)
  const shortcuts = [
    ['⌘K',        'Search nodes'],
    ['S',         'Settings'],
    ['Enter',     'Open selected'],
    ['Backspace', 'Go up one level'],
    ['Esc',       'Close / deselect'],
    ['Scroll',    'Zoom in / out'],
  ]

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const panelH = 180
      const panelW = 230
      const x = Math.max(8, Math.min(rect.left, window.innerWidth - panelW - 8))
      const y = Math.max(8, rect.top - panelH - 8)
      setPanelPos({ x, y })
    }
    setOpen(v => !v)
  }

  return (
    <div style={{ position: 'fixed', bottom: 56, left: 20, zIndex: 90 }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          background: 'rgba(8,8,22,0.75)',
          border: '1px solid rgba(124,157,245,0.2)',
          borderRadius: '50%',
          width: 22, height: 22,
          color: 'rgba(110,110,158,0.7)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(124,157,245,0.5)'
          e.currentTarget.style.color = '#e2e2f2'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(124,157,245,0.2)'
          e.currentTarget.style.color = 'rgba(110,110,158,0.7)'
        }}
      >?</button>

      {open && (
        <div style={{
          position: 'fixed',
          left: panelPos.x,
          top: panelPos.y,
          background: 'rgba(6,6,18,0.97)',
          border: '1px solid rgba(124,157,245,0.18)',
          borderRadius: 10,
          backdropFilter: 'blur(16px)',
          padding: '10px 14px',
          minWidth: 200,
          animation: 'fadeIn 0.15s ease',
          zIndex: 91,
        }}>
          {shortcuts.map(([key, label]) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', gap: 16, padding: '3px 0',
            }}>
              <kbd style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: '#7c9df5',
                background: 'rgba(124,157,245,0.1)',
                border: '1px solid rgba(124,157,245,0.22)',
                borderRadius: 4, padding: '1px 6px',
                whiteSpace: 'nowrap',
              }}>{key}</kbd>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: 'rgba(200,200,230,0.7)',
                textAlign: 'right',
              }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ZoomHint() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 52, right: 20,
      color: 'rgba(110,110,158,0.55)',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, letterSpacing: '0.08em',
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

function SceneBackground({ colorTheme }) {
  const { gl } = useThree()
  useEffect(() => {
    gl.setClearColor(colorTheme === 'deepspace' ? '#04040f' : '#03030a', 1)
  }, [colorTheme, gl])
  return null
}

function SceneObjects({
  currentRoot, parentNode, ringKey, selectedNodeId,
  onNodeClick, onNodeDoubleClick, onNodeContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
  onHoverPosition,
  hoveredId, onHoveredChange, onLayoutReady,
  showLabels, sway, colorTheme,
}) {
  const nodeCount = currentRoot?.children?.length ?? 0
  const radius = Math.max(3.8, Math.min(6.0, nodeCount * 0.28 + 3.0))

  const layout = useMemo(
    () => buildTentacleLayout(currentRoot?.children ?? [], radius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRoot, radius],
  )

  useEffect(() => { onLayoutReady?.(layout) }, [layout, onLayoutReady])

  const revealProgress = useRevealProgress(ringKey, 1200)

  const centerRef = useRef()
  useFrame(({ clock }) => {
    if (!centerRef.current) return
    const t = clock.getElapsedTime()
    const scale = 1 + Math.sin(t * (Math.PI * 2 / 3.5)) * 0.03
    centerRef.current.scale.setScalar(scale)
  })

  return (
    <group>
      <StarField />
      <Grid
        position={[0, -6, 0]}
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#1a1a3a"
        sectionSize={5}
        sectionThickness={0.8}
        sectionColor="#2a2a4a"
        fadeDistance={20}
        fadeStrength={2}
        infiniteGrid
      />

      <ambientLight intensity={colorTheme === 'deepspace' ? 0.3 : 0.5} color="#08083a" />
      <pointLight position={[0, 0, 0]} intensity={3.0} color="#ffffff" distance={14} decay={2} />
      <pointLight position={[0, 10, 5]} intensity={0.6} color="#7c9df5" distance={25} decay={2} />
      <pointLight position={[0, -8, -6]} intensity={0.4} color="#c8a2ff" distance={20} decay={2} />

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
        const color = getNodeColor(node)
        const delay = i * 0.045
        return (
          <group key={node.id}>
            <Tentacle
              curve={curve}
              basePoints={basePoints}
              index={i}
              color={color}
              hovered={isHovered}
              revealProgress={revealProgress}
              delay={delay}
              sway={sway}
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
              showLabel={showLabels && hoveredId !== node.id}
              onPointerEnter={(n, e) => {
                onHoveredChange(node.id)
                onHoverPosition?.(endPosition)
                onPointerEnter?.(n, e)
              }}
              onPointerMove={onPointerMove}
              onPointerLeave={() => {
                onHoveredChange(null)
                onHoverPosition?.(null)
                onPointerLeave?.()
              }}
            />
          </group>
        )
      })}
    </group>
  )
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

export default function ThreeScene({ treeData, onLoadingChange }) {
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
    autoRotate: true,
    showLabels: true,
    sway:       true,
    scanDepth:  2,
    colorTheme: 'dark',
  })
  const setSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }))
  const scanDepthRef = useRef(2)
  scanDepthRef.current = settings.scanDepth
  const originalRootRef = useRef(null)

  const currentRoot = navStack[navStack.length - 1] ?? null
  const parentNode = navStack[navStack.length - 2] ?? null

  useEffect(() => {
    loadTree(2).then(data => {
      setNavStack([data])
      originalRootRef.current = data
    }).catch(console.error)
  }, [])

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
  }, [settingsOpen, searchOpen, selectedNode, parentNode, handleNodeDoubleClick])

  const showBack = navStack.length > 1

  return (
    <>
      <Breadcrumb
        navStack={navStack}
        onCrumbClick={(idx) => setNavStack(prev => prev.slice(0, idx + 1))}
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
          <CameraRig hoveredPosition={hoveredEndPos} autoRotate={settings.autoRotate} />
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
              showLabels={settings.showLabels}
              sway={settings.sway}
              colorTheme={settings.colorTheme}
            />
          )}
        </Canvas>
      </div>
      <ZoomHint />
      <button
        onClick={() => setSettingsOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 84,
          left: 20,
          zIndex: 90,
          width: 22, height: 22,
          borderRadius: '50%',
          background: settingsOpen ? 'rgba(124,157,245,0.15)' : 'rgba(8,8,22,0.75)',
          border: `1px solid ${settingsOpen ? 'rgba(124,157,245,0.45)' : 'rgba(124,157,245,0.2)'}`,
          color: settingsOpen ? '#e2e2f2' : 'rgba(110,110,158,0.7)',
          fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => {
          if (!settingsOpen) {
            e.currentTarget.style.borderColor = 'rgba(124,157,245,0.5)'
            e.currentTarget.style.color = '#e2e2f2'
          }
        }}
        onMouseLeave={e => {
          if (!settingsOpen) {
            e.currentTarget.style.borderColor = 'rgba(124,157,245,0.2)'
            e.currentTarget.style.color = 'rgba(110,110,158,0.7)'
          }
        }}
        aria-label="Settings"
        title="Settings"
      >⚙</button>
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          setSetting={setSetting}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <KeyboardLegend />
      <Minimap
        layout={layout}
        hoveredId={hoveredId}
        selectedId={selectedNode?.id}
        onNodeClick={setSelectedNode}
      />
      <PinTray pins={pins} onJump={handleJump} onUnpin={handleUnpin} />
      <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} />
      {selectedNode && (
        <Panel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          isPinned={pins.some(p => p.id === selectedNode?.id)}
          onPin={() => handlePin(selectedNode)}
          onUnpin={() => handleUnpin(selectedNode)}
        />
      )}
      {showBack && (
        <BackToProjectsButton
          visible={true}
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
        />
      )}
      {searchOpen && (
        <NodeSearch
          tree={originalRootRef.current}
          onSelect={handleSearchSelect}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  )
}
