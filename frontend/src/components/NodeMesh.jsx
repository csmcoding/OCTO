import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { getActiveSignals } from '../utils/signals'
import { PALETTE, getNodeColor } from '../utils/palette'

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
  revealProgress = 1, delay = 0,
  isSelected = false,
  showLabel = true,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const activeSignals = getActiveSignals(node)
  const hasSignal = activeSignals.length > 0

  const nodeColor = isSelected ? PALETTE.selected : getNodeColor(node)
  const emissiveIntensity = isHovered ? 0.8 : hasSignal ? 0.4 : 0.35

  const baseRadius = node.type === 'folder'
    ? Math.min(0.55, 0.28 + (node.childCount ?? node.children?.length ?? 0) * 0.022)
    : Math.min(0.45, 0.20 + Math.log1p(node.size ?? 0) * 0.012)
  const isAlert = activeSignals.some(k => k === 'gitDirty' || k === 'gitUnpushed')
  const radius = isAlert ? baseRadius * 1.12 : baseRadius

  const nodeProgress = revealProgress >= 1
    ? 1
    : Math.max(0, Math.min((revealProgress * 1.2 - delay) / 0.4, 1))

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
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color="#0a0a1a"
          emissive={nodeColor}
          emissiveIntensity={emissiveIntensity}
          transparent={nodeProgress < 1}
          opacity={nodeProgress}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {hasSignal && <PulsingLight color={nodeColor} />}
      {hasSignal && (
        <Text position={[0, 0.6, 0]} fontSize={0.25} color={nodeColor} depthOffset={-1}>
          !
        </Text>
      )}
      {node.hasChildren && node.children.length === 0 && (
        <mesh>
          <torusGeometry args={[0.55, 0.02, 8, 40]} />
          <meshBasicMaterial color={nodeColor} opacity={0.3} transparent />
        </mesh>
      )}

      {showLabel && <Html
        position={[0, -0.62, 0]}
        center
        distanceFactor={8}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          color: nodeColor + 'e6',
          fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          textShadow: `0 0 8px ${nodeColor}`,
          userSelect: 'none',
          maxWidth: '80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.01em',
        }}>
          {node.name}
        </div>
      </Html>}
    </group>
  )
}
