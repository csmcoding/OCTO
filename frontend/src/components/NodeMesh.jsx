import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
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
  onClick, onDoubleClick, onContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const isFolder = node.type === 'folder'
  const dominantColor = getDominantColor(node)
  const activeSignals = getActiveSignals(node)
  const hasSignal = activeSignals.length > 0

  const emissiveColor = dominantColor ?? '#4A90D9'
  const emissiveIntensity = isHovered ? 0.45 : hasSignal ? 0.22 : 0.06

  return (
    <group position={position}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick?.(node) }}
        onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(node) }}
        onContextMenu={(e) => { e.stopPropagation(); onContextMenu?.(node, e) }}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          onPointerEnter?.(node, e)
        }}
        onPointerMove={(e) => { e.stopPropagation(); onPointerMove?.(node, e) }}
        onPointerLeave={(e) => {
          e.stopPropagation()
          setIsHovered(false)
          onPointerLeave?.(node, e)
        }}
      >
        {isFolder
          ? <torusGeometry args={[0.35, 0.08, 16, 60]} />
          : <sphereGeometry args={[0.1, 12, 12]} />
        }
        <meshStandardMaterial
          color="#0e0e28"
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>

      {hasSignal && <PulsingLight color={dominantColor} />}
      {hasSignal && (
        <Text position={[0, 0.6, 0]} fontSize={0.25} color={dominantColor} depthOffset={-1}>
          !
        </Text>
      )}
      {node.hasChildren && node.children.length === 0 && (
        <mesh>
          <torusGeometry args={[0.55, 0.02, 8, 40]} />
          <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
      )}

      <Html
        position={[0, -0.75, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: dominantColor
            ? `${dominantColor}bf`
            : 'rgba(200,200,230,0.55)',
          fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
          fontSize: '9px',
          whiteSpace: 'nowrap',
          textAlign: 'center',
          textShadow: '0 1px 6px rgba(0,0,0,1)',
          userSelect: 'none',
          maxWidth: '70px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {node.name}
        </div>
      </Html>
    </group>
  )
}
