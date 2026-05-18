import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { TubeGeometry } from 'three'
import { swayTentacle } from '../utils/buildTentacleLayout'

export default function Tentacle({ curve, index, color = '#4A90D9', hovered = false }) {
  const meshRef = useRef()
  const curveRef = useRef(curve)
  const originalMid = useRef(curve.points[1].clone())
  const lastSway = useRef({ x: curve.points[1].x, y: curve.points[1].y })

  const tubeGeo = useMemo(
    () => new TubeGeometry(curveRef.current, 20, 0.028, 6, false),
    [],
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    // Reset to original before sway to prevent drift
    curveRef.current.points[1].copy(originalMid.current)
    swayTentacle(curveRef.current, index, clock.getElapsedTime())

    const p1 = curveRef.current.points[1]
    const dx = Math.abs(p1.x - lastSway.current.x)
    const dy = Math.abs(p1.y - lastSway.current.y)
    if (dx > 0.004 || dy > 0.004) {
      meshRef.current.geometry.dispose()
      meshRef.current.geometry = new TubeGeometry(
        curveRef.current, 20, hovered ? 0.038 : 0.024, 6, false,
      )
      lastSway.current = { x: p1.x, y: p1.y }
    }
  })

  return (
    <mesh ref={meshRef} geometry={tubeGeo}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.6 : 0.15}
        transparent
        opacity={hovered ? 0.9 : 0.55}
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
  )
}
