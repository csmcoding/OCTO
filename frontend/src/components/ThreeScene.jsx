import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { loadTree, loadSubtree } from '../utils/loadTree'
import { buildRingLayout } from '../utils/buildRingLayout'
import NodeMesh from './NodeMesh'
import Panel from './Panel'
import BackToProjectsButton from './BackToProjectsButton'

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

function SceneObjects({ currentRoot, onNodeClick }) {
  const ringLayout = buildRingLayout(currentRoot?.children ?? [], 4)

  return (
    <>
      <pointLight position={[0, 0, 0]} intensity={1.5} color="#FFFFFF" />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      <Line points={[[0, 0, 0], [0, 0, -3]]} color="#4A90D9" lineWidth={1.5} />

      <mesh position={[0, 0, -3]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#4A90D9" />
      </mesh>

      {ringLayout.map(({ node, position }) => (
        <NodeMesh
          key={node.id}
          node={node}
          position={position}
          onClick={onNodeClick}
        />
      ))}
    </>
  )
}

export default function ThreeScene({ treeData, onLoadingChange }) {
  const [currentRoot, setCurrentRoot] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const originalRootRef = useRef(null)

  // Initial load from API
  useEffect(() => {
    loadTree(2).then(data => {
      setCurrentRoot(data)
      originalRootRef.current = data
    }).catch(console.error)
  }, [])

  // Post-scan refresh pushed from Dashboard
  useEffect(() => {
    if (treeData) {
      setCurrentRoot(treeData)
      setSelectedNode(null)
      originalRootRef.current = treeData
    }
  }, [treeData])

  const handleNodeClick = async (node) => {
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
      setCurrentRoot(target)
      setSelectedNode(null)
    } else {
      setSelectedNode(node)
    }
  }

  const showBack = currentRoot !== null && currentRoot !== originalRootRef.current

  return (
    <>
      <Canvas camera={{ position: [0, 2, 1] }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#0a0a0f']} />
        <ambientLight intensity={0.3} />
        <CameraRig />
        {currentRoot && <SceneObjects currentRoot={currentRoot} onNodeClick={handleNodeClick} />}
        <OrbitControls />
      </Canvas>
      {selectedNode && (
        <Panel node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
      {showBack && (
        <BackToProjectsButton
          visible={true}
          onReset={() => {
            setCurrentRoot(originalRootRef.current)
            setSelectedNode(null)
          }}
        />
      )}
    </>
  )
}
