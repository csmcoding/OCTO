import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { loadTree, loadSubtree, openNode } from '../utils/loadTree'
import { buildRingLayout } from '../utils/buildRingLayout'
import NodeMesh from './NodeMesh'
import Panel from './Panel'
import BackToProjectsButton from './BackToProjectsButton'
import Breadcrumb from './Breadcrumb'
import NodeTooltip from './NodeTooltip'
import NodeSearch from './NodeSearch'

function CameraRig() {
  const { camera } = useThree()
  const animated = useRef(false)

  useFrame(() => {
    if (animated.current) return
    camera.position.z += (10 - camera.position.z) * 0.03
    camera.position.y += (2 - camera.position.y) * 0.03
    if (camera.position.z > 9.8) animated.current = true
  })

  return null
}

function SceneObjects({ currentRoot, parentNode, onNodeClick, onNodeDoubleClick, onPointerEnter, onPointerMove, onPointerLeave }) {
  const ringLayout = buildRingLayout(currentRoot?.children ?? [], 4)

  return (
    <>
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#FFFFFF" />

      {parentNode && (
        <mesh position={[0, 0, 3]} scale={[0.55, 0.55, 0.55]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={parentNode.dominantColor ?? '#4A90D9'}
            opacity={0.35}
            transparent
          />
        </mesh>
      )}

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {ringLayout.map(({ node, position }) => (
        <NodeMesh
          key={node.id}
          node={node}
          position={position}
          onClick={onNodeClick}
          onDoubleClick={onNodeDoubleClick}
          onPointerEnter={onPointerEnter}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        />
      ))}
    </>
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

  // Ctrl+K to open search
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

  // Single click → open panel
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  // Double click → drill in (folder) or open in editor (file)
  const handleNodeDoubleClick = useCallback(async (node) => {
    if (node.type === 'folder') {
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
    } else {
      openNode(node.path, 'editor').catch(console.error)
    }
  }, [onLoadingChange])

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
      <Canvas
        gl={{ pixelRatio: window.devicePixelRatio }}
        camera={{ position: [0, 2, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <ambientLight intensity={0.3} />
        <CameraRig />
        {currentRoot && (
          <SceneObjects
            currentRoot={currentRoot}
            parentNode={parentNode}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPointerEnter={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
            onPointerMove={(node, e) => setTooltip({ node, x: e.clientX, y: e.clientY })}
            onPointerLeave={() => setTooltip({ node: null, x: 0, y: 0 })}
          />
        )}
        <OrbitControls />
      </Canvas>
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
