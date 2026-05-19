import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, NormalBlending } from 'three'
import { THEMES } from '../utils/palette'

export default function HoverRipple({ position, colorTheme = 'dark' }) {
  const meshRef       = useRef()
  const progress      = useRef(0)
  const active        = useRef(false)
  const lastPos       = useRef(null)
  const colorThemeRef = useRef(colorTheme)
  colorThemeRef.current = colorTheme

  useEffect(() => {
    if (!position) return
    const changed = !lastPos.current ||
      lastPos.current.x !== position.x ||
      lastPos.current.y !== position.y ||
      lastPos.current.z !== position.z
    if (changed) {
      progress.current = 0
      active.current = true
      lastPos.current = { x: position.x, y: position.y, z: position.z }
      if (meshRef.current) {
        meshRef.current.position.set(position.x, position.y, position.z)
      }
    }
  }, [position])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (!active.current) {
      meshRef.current.material.opacity = 0
      return
    }
    progress.current = Math.min(progress.current + delta / 0.6, 1)
    const p = progress.current
    const maxOpacity = (THEMES[colorThemeRef.current] ?? THEMES.dark).rippleMaxOpacity
    meshRef.current.scale.setScalar(0.4 + p * 1.8)
    meshRef.current.material.opacity = maxOpacity * (1 - p)
    if (p >= 1) active.current = false
  })

  const th = THEMES[colorTheme] ?? THEMES.dark
  const blending = th.rippleBlending === 'normal' ? NormalBlending : AdditiveBlending

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.42, 0.52, 48]} />
      <meshBasicMaterial
        color={th.rippleColor}
        transparent
        opacity={0}
        blending={blending}
        depthWrite={false}
        side={2}
      />
    </mesh>
  )
}
