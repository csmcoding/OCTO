import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, BufferAttribute, PointsMaterial, AdditiveBlending } from 'three'

const COUNT  = 400
const SPREAD = 14
const SPEED  = 0.008

export default function MarineSnow({ sway = true }) {
  const pointsRef = useRef()

  const { positions, velocities } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      positions[i3]     = (Math.random() - 0.5) * SPREAD * 2
      positions[i3 + 1] = (Math.random() - 0.5) * 16
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD * 2
      velocities[i3]     = (Math.random() - 0.5) * 0.002
      velocities[i3 + 1] = -(SPEED + Math.random() * 0.006)
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.002
    }
    return { positions, velocities }
  }, [])

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions.slice(), 3))
    return geo
  }, [positions])

  const material = useMemo(() => new PointsMaterial({
    color: '#4ecdc4',
    size: 0.03,
    transparent: true,
    opacity: 0.35,
    blending: AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  }), [])

  useFrame(({ clock }) => {
    if (!pointsRef.current || !sway) return
    const pos = pointsRef.current.geometry.attributes.position
    const t = clock.getElapsedTime()
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      pos.array[i3]     += velocities[i3]     + Math.sin(t * 0.3 + i) * 0.0003
      pos.array[i3 + 1] += velocities[i3 + 1]
      pos.array[i3 + 2] += velocities[i3 + 2] + Math.cos(t * 0.2 + i) * 0.0003
      if (pos.array[i3 + 1] < -8) {
        pos.array[i3]     = (Math.random() - 0.5) * SPREAD * 2
        pos.array[i3 + 1] = 8
        pos.array[i3 + 2] = (Math.random() - 0.5) * SPREAD * 2
      }
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
