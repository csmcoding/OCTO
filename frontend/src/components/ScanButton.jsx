import { useState } from 'react'
import { triggerScan } from '../utils/loadTree'

const BASE = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  background: 'rgba(8, 8, 24, 0.88)',
  border: '1px solid rgba(74, 144, 217, 0.25)',
  borderRadius: 20,
  padding: '6px 14px',
  fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
  fontSize: 12,
  letterSpacing: '0.02em',
  zIndex: 100,
}

export default function ScanButton({ onScanComplete }) {
  const [status, setStatus] = useState('idle')
  const [count, setCount] = useState(0)
  const [total, setTotal] = useState(0)

  const handleClick = async () => {
    if (status === 'scanning') return
    setStatus('scanning')
    setCount(0)
    try {
      const result = await triggerScan((data) => {
        if (data.event === 'progress') setCount(data.scanned)
      })
      setTotal(result.total)
      setStatus('done')
      onScanComplete()
      setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  if (status === 'scanning') return (
    <div style={{ ...BASE, color: '#4A90D9', cursor: 'default', animation: 'scanPulse 1.5s ease-in-out infinite' }}>
      scanning… {count} dirs
    </div>
  )
  if (status === 'done') return (
    <div style={{ ...BASE, color: '#44ff88', borderColor: 'rgba(68,255,136,0.25)', cursor: 'default' }}>
      ✓ {total} dirs
    </div>
  )
  if (status === 'error') return (
    <div style={{ ...BASE, color: '#ff4444', borderColor: 'rgba(255,68,68,0.25)', cursor: 'default' }}>
      ✗ scan failed
    </div>
  )
  return (
    <button style={{ ...BASE, color: '#4A90D9', cursor: 'pointer' }} onClick={handleClick}>
      ⟳ Rescan
    </button>
  )
}
