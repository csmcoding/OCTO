import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { loadTree, loadSubtree, openNode } from '../utils/loadTree'
import { buildTentacleLayout } from '../utils/buildTentacleLayout'
import Tentacle from './Tentacle'
import NodeMesh from './NodeMesh'
import Panel from './Panel'
import BackToProjectsButton from './BackToProjectsButton'
import Breadcrumb from './Breadcrumb'
import NodeTooltip from './NodeTooltip'
import NodeSearch from './NodeSearch'
import NodeContextMenu from './NodeContextMenu'

function CameraRig() {
  const { camera } = useThree()
  const animated = useRef(false)

  useFrame(() => {
    if (animated.current) return
    camera.position.z += (10 - camera.position.z) * 0.03
    camera.position.y += (4 - camera.position.y) * 0.03
    if (camera.position.z > 9.8) animated.current = true
  })

  return null
}

function SceneObjects({
  currentRoot, parentNode,
  onNodeClick, onNodeDoubleClick, onNodeContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
}) {
  const [hoveredId, setHoveredId] = useState(null)
  const layout = buildTentacleLayout(currentRoot?.children ?? [])

  return (
    <group>
      <ambientLight intensity={0.25} color="#08082a" />
      <pointLight position={[0, 8, 4]} intensity={1.4} color="#4A90D9" />
      <pointLight position={[0, -4, -6]} intensity={0.5} color="#1a0830" />

      {parentNode && (
        <mesh position={[0, 0, 3]} scale={[0.5, 0.5, 0.5]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={parentNode.dominantColor ?? '#4A90D9'}
            emissive={parentNode.dominantColor ?? '#4A90D9'}
            emissiveIntensity={0.1}
            opacity={0.25}
            transparent
          />
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#e8e8f8"
          emissive="#4A90D9"
          emissiveIntensity={0.12}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {layout.map(({ node, endPosition, curve }, i) => {
        const isHovered = hoveredId === node.id
        const tentacleColor = node.dominantColor ?? '#4A90D9'
        return (
          <group key={node.id}>
            <Tentacle curve={curve} index={i} color={tentacleColor} hovered={isHovered} />
            <NodeMesh
              node={node}
              position={[endPosition.x, endPosition.y, endPosition.z]}
              onClick={onNodeClick}
              onDoubleClick={onNodeDoubleClick}
              onContextMenu={onNodeContextMenu}
              onPointerEnter={(n, e) => { setHoveredId(node.id); onPointerEnter?.(n, e) }}
              onPointerMove={onPointerMove}
              onPointerLeave={(n, e) => { setHoveredId(null); onPointerLeave?.() }}
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
          onCreated={({ gl }) => gl.setClearColor('#050508')}
          gl={{ pixelRatio: window.devicePixelRatio, antialias: true }}
          camera={{ position: [0, 4, 10], fov: 55 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <CameraRig />
          {currentRoot && (
            <SceneObjects
              currentRoot={currentRoot}
              parentNode={parentNode}
              onNodeClick={handleNodeClick}
              onNodeDoubleClick={handleNodeDoubleClick}
              onNodeContextMenu={(node, e) =>
                setContextMenu({ node, x: e.clientX, y: e.clientY })
              }
              onPointerEnter={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerMove={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
              onPointerLeave={() => setTooltip({ node: null, x: 0, y: 0 })}
            />
          )}
          <OrbitControls />
        </Canvas>
      </div>
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
