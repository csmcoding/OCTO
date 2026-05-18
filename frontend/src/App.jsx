import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import BackendError from './components/BackendError'

export default function App() {
  const [backendReady, setBackendReady] = useState(false)
  const [backendError, setBackendError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:7823/health')
      if (res.ok) {
        setBackendReady(true)
        setBackendError(false)
      } else {
        setBackendError(true)
      }
    } catch {
      setBackendError(true)
    }
  }, [])

  useEffect(() => { checkBackend() }, [retryCount, checkBackend])

  const handleRetry = useCallback(() => setRetryCount(c => c + 1), [])

  if (backendError) return (
    <BackendError onRetry={handleRetry} retryCount={retryCount} />
  )
  if (!backendReady) return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#050508', margin: 0, padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#4A90D9', fontFamily: 'monospace', fontSize: 14,
    }}>
      connecting to backend...
    </div>
  )
  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#050508', margin: 0, padding: 0,
    }}>
      <Dashboard />
    </div>
  )
}
