import { useState } from 'react'
import { triggerScan } from '../utils/loadTree'

const BASE_STYLE = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  background: 'rgba(10, 10, 30, 0.92)',
  border: '1px solid #4A90D9',
  borderRadius: 6,
  padding: '8px 16px',
  fontFamily: 'monospace',
  fontSize: 13,
  cursor: 'pointer',
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

  if (status === 'scanning') {
    return (
      <div style={{ ...BASE_STYLE, color: '#4A90D9', cursor: 'default', borderColor: '#4A90D9' }}>
        scanning... {count} dirs
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div style={{ ...BASE_STYLE, color: '#44ff88', cursor: 'default', borderColor: '#44ff88' }}>
        ✓ done — {total} dirs
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ ...BASE_STYLE, color: '#FF4444', cursor: 'default', borderColor: '#FF4444' }}>
        ✗ scan failed
      </div>
    )
  }

  return (
    <button style={{ ...BASE_STYLE, color: '#4A90D9' }} onClick={handleClick}>
      ⟳ Rescan
    </button>
  )
}
