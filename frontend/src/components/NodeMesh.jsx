import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { getActiveSignals, getDominantColor } from '../utils/signals'

function PulsingLight({ color }) {
  const lightRef = useRef()

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3)
    }
  })

  return <pointLight ref={lightRef} color={color} distance={2} />
}

export default function NodeMesh({
  node, position,
  onClick, onDoubleClick,
  onPointerEnter, onPointerMove, onPointerLeave,
}) {
  const isFolder = node.type === 'folder'
  const dominantColor = getDominantColor(node)
  const activeSignals = getActiveSignals(node)
  const hasSignal = activeSignals.length > 0
  const color = isFolder ? (dominantColor ?? '#4A90D9') : '#888888'

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(node) }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(node) }}
        onPointerEnter={(e) => { e.stopPropagation(); onPointerEnter?.(node, e) }}
        onPointerMove={(e) => { e.stopPropagation(); onPointerMove?.(node, e) }}
        onPointerLeave={(e) => { e.stopPropagation(); onPointerLeave?.(node, e) }}
      >
        {isFolder
          ? <torusGeometry args={[0.35, 0.08, 16, 60]} />
          : <sphereGeometry args={[0.1, 12, 12]} />
        }
        <meshStandardMaterial color={color} />
      </mesh>
      {hasSignal && <PulsingLight color={dominantColor} />}
      {hasSignal && (
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.25}
          color={dominantColor}
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
