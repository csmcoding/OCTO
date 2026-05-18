import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { TubeGeometry, CatmullRomCurve3 } from 'three'
import { swayTentacle } from '../utils/buildTentacleLayout'

export default function Tentacle({
  curve, basePoints, index,
  color = '#4ecdc4', hovered = false,
  revealProgress = 1, delay = 0,
  sway = true,
}) {
  const meshRef = useRef()
  const frame = useRef(0)
  const revealStartRef = useRef(null)

  const initGeo = useMemo(
    () => new TubeGeometry(curve, 24, 0.022, 6, false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useEffect(() => () => meshRef.current?.geometry?.dispose(), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    frame.current++

    const now = clock.getElapsedTime()

    if (revealProgress <= 0) {
      revealStartRef.current = null
      meshRef.current.visible = false
      return
    }

    if (revealStartRef.current === null) {
      revealStartRef.current = now
    }
    meshRef.current.visible = true

    if (sway) swayTentacle(curve, basePoints, index, now)

    if (frame.current % 3 !== 0) return

    let tubeCurve = curve
    let tubeSeg = 24

    if (revealProgress < 1) {
      const elapsed = now - revealStartRef.current
      const staggered = Math.max(0, elapsed - delay)
      const localP = Math.min(staggered / 1.2, revealProgress)

      if (localP < 0.02) {
        meshRef.current.visible = false
        return
      }

      if (localP < 0.99) {
        const n = Math.max(3, Math.ceil(16 * localP))
        const pts = []
        for (let j = 0; j <= n; j++) {
          pts.push(curve.getPoint((j / n) * localP))
        }
        tubeCurve = new CatmullRomCurve3(pts)
        tubeSeg = n
      }
    }

    const old = meshRef.current.geometry
    meshRef.current.geometry = new TubeGeometry(
      tubeCurve, tubeSeg, hovered ? 0.042 : 0.022, 6, false,
    )
    old?.dispose()
  })

  return (
    <mesh ref={meshRef} geometry={initGeo}>
      <meshStandardMaterial
        color="#030308"
        emissive={color}
        emissiveIntensity={hovered ? 0.7 : 0.2}
        transparent
        opacity={hovered ? 0.9 : 0.5}
        roughness={0.35}
        metalness={0.4}
      />
    </mesh>
  )
}
