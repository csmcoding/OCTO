import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'

function PulsingLight() {
  const lightRef = useRef()

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3)
    }
  })

  return <pointLight ref={lightRef} color="#FF8C00" distance={2} />
}

export default function NodeMesh({ node, position, onClick }) {
  const isFolder = node.type === 'folder'
  const color = isFolder
    ? node.gitDirty ? '#FF8C00' : '#4A90D9'
    : '#888888'

  return (
    <group position={position}>
      <mesh onClick={() => onClick(node)}>
        {isFolder
          ? <torusGeometry args={[0.35, 0.08, 16, 60]} />
          : <sphereGeometry args={[0.1, 12, 12]} />
        }
        <meshStandardMaterial color={color} />
      </mesh>
      {node.gitDirty && <PulsingLight />}
      {node.gitDirty && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.25}
          color="#FF8C00"
          depthOffset={-1}
        >
          !
        </Text>
      )}
      {node.hasChildren && node.children.length === 0 && (
        <mesh>
          <torusGeometry args={[0.55, 0.02, 8, 40]} />
          <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      )}
    </group>
  )
}
