import { useState, useEffect } from 'react'

export const ERROR_HEADING = 'backend unreachable'

export default function BackendError({ onRetry, retryCount }) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown <= 0) {
      setCountdown(5)
      onRetry()
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onRetry])

  const handleManualRetry = () => {
    setCountdown(5)
    onRetry()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0f',
      gap: 16,
    }}>
      <span style={{ fontSize: 64 }}>🐙</span>
      <h2 style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: 20, margin: 0 }}>
        {ERROR_HEADING}
      </h2>
      <p style={{ color: '#666688', fontFamily: 'monospace', fontSize: 13, margin: 0, textAlign: 'center' }}>
        make sure the API server is running on port 7823
      </p>
      <button
        onClick={handleManualRetry}
        style={{
          background: '#1a2a3a',
          color: '#4A90D9',
          border: '1px solid #2a3a4a',
          padding: '10px 20px',
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 13,
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        retry connection
      </button>
      <p style={{ color: '#444466', fontFamily: 'monospace', fontSize: 12, margin: 0 }}>
        retrying in {countdown}s...
      </p>
    </div>
  )
}
