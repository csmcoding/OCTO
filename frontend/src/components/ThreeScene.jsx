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

function CameraRig({ hoveredPosition }) {
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
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  useFrame((_, delta) => {
    base.current.theta += delta * 0.08

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

function SceneObjects({
  currentRoot, parentNode, ringKey, selectedNodeId,
  onNodeClick, onNodeDoubleClick, onNodeContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
  onHoverPosition,
}) {
  const [hoveredId, setHoveredId] = useState(null)

  const nodeCount = currentRoot?.children?.length ?? 0
  const radius = Math.max(3.8, Math.min(6.0, nodeCount * 0.28 + 3.0))

  const layout = useMemo(
    () => buildTentacleLayout(currentRoot?.children ?? [], radius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRoot, radius],
  )
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

      <ambientLight intensity={0.5} color="#08083a" />
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
              onPointerEnter={(n, e) => {
                setHoveredId(node.id)
                onHoverPosition?.(endPosition)
                onPointerEnter?.(n, e)
              }}
              onPointerMove={onPointerMove}
              onPointerLeave={() => {
                setHoveredId(null)
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

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const [revealKey, setRevealKey] = useState(0)
  useEffect(() => {
    if (currentRoot) setRevealKey(k => k + 1)
  }, [currentRoot])

  const handleDrillIn = useCallback(async (node) => {
    let target = node
    if (node.hasChildren && node.children.length === 0) {
      onLoadingChange(true)
      try {
        target = await loadSubtree(node.path, 3)
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
          <CameraRig hoveredPosition={hoveredEndPos} />
          {currentRoot && (
            <SceneObjects
              currentRoot={currentRoot}
              parentNode={parentNode}
              ringKey={revealKey}
              selectedNodeId={selectedNode?.id}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onNodeContextMenu={(node, e) =>
                setContextMenu({ node, x: e.clientX, y: e.clientY })
              }
              onPointerEnter={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerMove={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerLeave={() => setTooltip({ node: null, x: 0, y: 0 })}
              onHoverPosition={setHoveredEndPos}
            />
          )}
        </Canvas>
      </div>
      <ZoomHint />
      <NodeTooltip node={tooltip.node} position={{ x: tooltip.x, y: tooltip.y }} />
      {selectedNode && (
        <Panel node={selectedNode} onClose={() => setSelectedNode(null)} />
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
