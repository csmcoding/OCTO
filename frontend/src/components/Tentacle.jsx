import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { TubeGeometry } from 'three'
import { swayTentacle } from '../utils/buildTentacleLayout'

const SEGMENTS_HI = 24  // ≤30 nodes in scene, or hovered
const SEGMENTS_LO = 10  // >30 nodes in scene, not hovered

function Tentacle({
  curve, basePoints, index,
  color = '#4ecdc4',
  hovered = false,
  nodeCount = 1,
  sway = true,
}) {
  const meshRef = useRef()
  const geoRef  = useRef(null)

  const segments = (nodeCount > 30 && !hovered) ? SEGMENTS_LO : SEGMENTS_HI
  const radius   = hovered ? 0.042 : 0.022

  const buildGeo = () => {
    geoRef.current?.dispose()
    const geo = new TubeGeometry(curve, segments, radius, 6, false)
    geoRef.current = geo
    geo.attributes.position.usage = 35048  // DynamicDrawUsage
    return geo
  }

  // Build once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initGeo = useMemo(buildGeo, [])

  // Rebuild only when LOD tier or hover changes (rare, not every frame)
  const prevSegmentsRef = useRef(segments)
  const prevHoveredRef  = useRef(hovered)
  useEffect(() => {
    if (
      prevSegmentsRef.current !== segments ||
      prevHoveredRef.current  !== hovered
    ) {
      if (meshRef.current) {
        meshRef.current.geometry = buildGeo()
      }
      prevSegmentsRef.current = segments
      prevHoveredRef.current  = hovered
    }
  })

  useEffect(() => () => geoRef.current?.dispose(), [])

  useFrame(({ clock }) => {
    if (!meshRef.current || !sway) return

    swayTentacle(curve, basePoints, index, clock.getElapsedTime())

    const geo = meshRef.current.geometry
    if (!geo?.attributes?.position) return

    const pos = geo.attributes.position
    const tmpGeo = new TubeGeometry(curve, segments, radius, 6, false)
    const tmpPos = tmpGeo.attributes.position

    if (tmpPos.count === pos.count) {
      pos.array.set(tmpPos.array)
      pos.needsUpdate = true
    }
    tmpGeo.dispose()
  })

  return (
    <mesh ref={meshRef} geometry={initGeo}>
      <meshStandardMaterial
        color="#030308"
        emissive={color}
        emissiveIntensity={0.08}
        transparent
        opacity={hovered ? 0.85 : 0.45}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  )
}

export default React.memo(Tentacle)
