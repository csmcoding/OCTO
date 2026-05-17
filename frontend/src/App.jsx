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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0f',
      color: '#4A90D9', fontFamily: 'monospace', fontSize: 14,
    }}>
      connecting to backend...
    </div>
  )
  return <Dashboard />
}
