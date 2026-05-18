import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import { Color, ShaderMaterial, AdditiveBlending } from 'three'
import { getActiveSignals, SIGNAL_COLORS } from '../utils/signals'
import { PALETTE, getNodeColor } from '../utils/palette'

function makeFresnelMaterial(hexColor) {
  return new ShaderMaterial({
    uniforms: {
      uColor:        { value: new Color(hexColor) },
      uRimColor:     { value: new Color('#a8f0ee') },
      uRimPower:     { value: 2.5 },
      uRimIntensity: { value: 0.7 },
      uPulse:        { value: 0.0 },
      uSelected:     { value: 0.0 },
      uHovered:      { value: 0.0 },
      uOpacity:      { value: 0.0 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal  = normalize(normalMatrix * normal);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3  uColor;
      uniform vec3  uRimColor;
      uniform float uRimPower;
      uniform float uRimIntensity;
      uniform float uPulse;
      uniform float uSelected;
      uniform float uHovered;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        float rim = pow(1.0 - max(dot(vViewDir, vNormal), 0.0), uRimPower);
        float pulse = 0.5 + 0.5 * uPulse;

        vec3 color = uColor * 0.4;
        vec3 rimGlow = uRimColor * rim * uRimIntensity * pulse;
        float boost = 1.0 + uHovered * 0.5 + uSelected * 0.8;

        gl_FragColor = vec4((color + rimGlow) * boost, uOpacity);
      }
    `,
    transparent: true,
    depthWrite: true,
  })
}

function SignalAura({ color, index }) {
  const meshRef = useRef()
  const { camera } = useThree()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.quaternion.copy(camera.quaternion)
    const t = clock.getElapsedTime()
    meshRef.current.material.opacity = 0.1 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.8 + index))
    meshRef.current.scale.setScalar(1.0 + 0.12 * Math.sin(t * 1.4 + index * 0.5))
  })

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.50, 0.78, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.25}
        blending={AdditiveBlending}
        depthWrite={false}
        side={2}
      />
    </mesh>
  )
}

// ── Activity aura ring ──────────────────────────────────────────────────────
// Rendered at a larger radius than SignalAura so they never overlap.
// level: 'hot' | 'warm' | 'cool' | null   isDirty: boolean
function ActivityAura({ level, isDirty, index }) {
  const meshRef = useRef()
  const color = isDirty   ? '#e8a020'
    : level === 'hot'     ? '#ff6b35'
    : level === 'warm'    ? '#c8a020'
    : level === 'cool'    ? '#4a9090'
    : '#444466'

  const baseOpacity = isDirty   ? 0.32
    : level === 'hot'  ? 0.28
    : level === 'warm' ? 0.16
    : level === 'cool' ? 0.08
    : 0.03

  const doPulse = isDirty || level === 'hot'

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    meshRef.current.material.opacity = doPulse
      ? baseOpacity * (0.55 + 0.45 * Math.sin(t * 2.1 + index * 0.7))
      : baseOpacity
    if (doPulse) {
      meshRef.current.scale.setScalar(1.0 + 0.06 * Math.sin(t * 1.6 + index * 0.5))
    }
  })

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.86, 1.08, 48]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={baseOpacity}
        blending={AdditiveBlending}
        depthWrite={false}
        side={2}
      />
    </mesh>
  )
}

function NodeMesh({
  node, position,
  onClick, onDoubleClick, onContextMenu,
  onPointerEnter, onPointerMove, onPointerLeave,
  revealProgress = 1, delay = 0,
  isSelected = false,
  showLabel = true,
  index = 0,
  activityMode = false,
  activityLevel = null,
  isActivityDirty = false,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const activeSignals = getActiveSignals(node)
  const hasSignals = activeSignals.length > 0

  const nodeColor = isSelected ? PALETTE.selected : getNodeColor(node)
  const auraColor = SIGNAL_COLORS[activeSignals[0]] ?? '#4ecdc4'

  const baseRadius = node.type === 'folder'
    ? Math.min(0.55, 0.28 + (node.childCount ?? node.children?.length ?? 0) * 0.022)
    : Math.min(0.45, 0.20 + Math.log1p(node.size ?? 0) * 0.012)
  const isAlert = activeSignals.some(k => k === 'gitDirty' || k === 'gitUnpushed')
  const radius = isAlert ? baseRadius * 1.12 : baseRadius

  const mat = useMemo(() => makeFresnelMaterial(nodeColor), [nodeColor])
  useEffect(() => () => mat?.dispose(), [mat])

  const isHoveredRef = useRef(isHovered)
  isHoveredRef.current = isHovered
  const isSelectedRef = useRef(isSelected)
  isSelectedRef.current = isSelected
  const revealRef = useRef({ revealProgress, delay })
  revealRef.current = { revealProgress, delay }
  const indexRef = useRef(index)
  indexRef.current = index

  useFrame(({ clock }) => {
    if (!mat) return
    const { revealProgress: rp, delay: d } = revealRef.current
    const nodeProgress = rp >= 1 ? 1 : Math.max(0, Math.min((rp * 1.2 - d) / 0.4, 1))
    const t = clock.getElapsedTime()
    mat.uniforms.uPulse.value    = Math.sin(t * 1.2 + indexRef.current * 0.7)
    mat.uniforms.uHovered.value  = isHoveredRef.current ? 1.0 : 0.0
    mat.uniforms.uSelected.value = isSelectedRef.current ? 1.0 : 0.0
    mat.uniforms.uOpacity.value  = nodeProgress
  })

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
        <primitive object={mat} attach="material" />
      </mesh>

      {hasSignals && <SignalAura color={auraColor} index={index} />}
      {activityMode && (activityLevel || isActivityDirty) && activityLevel !== 'stale' && (
        <ActivityAura level={activityLevel} isDirty={isActivityDirty} index={index} />
      )}

      {hasSignals && (
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

      {showLabel && (
        <Html
          position={[0, -0.62, 0]}
          center
          distanceFactor={8}
          occlude={false}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            color: nodeColor + 'f2',
            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            textShadow: `0 0 10px ${nodeColor}, 0 0 4px rgba(0,0,0,0.8)`,
            userSelect: 'none',
            maxWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '0.01em',
          }}>
            {node.name}
          </div>
        </Html>
      )}
    </group>
  )
}

export default React.memo(NodeMesh)
