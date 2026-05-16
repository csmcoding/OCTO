import { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import { loadTree } from '../utils/loadTree'
import { buildRingLayout } from '../utils/buildRingLayout'

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

function SceneObjects({ treeData }) {
  const layout = buildRingLayout(treeData.children, 4)

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

      {layout.map(({ node, position }) => (
        <mesh key={node.id} position={position}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#4A90D9" />
        </mesh>
      ))}
    </>
  )
}

export default function ThreeScene() {
  const [treeData, setTreeData] = useState(null)

  useEffect(() => {
    loadTree().then(setTreeData).catch(console.error)
  }, [])

  return (
    <Canvas camera={{ position: [0, 2, 1] }} style={{ width: '100%', height: '100%' }}>
      <color attach="background" args={['#0a0a0f']} />
      <ambientLight intensity={0.3} />
      <CameraRig />
      {treeData && <SceneObjects treeData={treeData} />}
      <OrbitControls />
    </Canvas>
  )
}
