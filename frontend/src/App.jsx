import { useState, useEffect, useCallback } from 'react'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import BackendError from './components/BackendError'

export default function App() {
  const [backendReady, setBackendReady]     = useState(false)
  const [backendError, setBackendError]     = useState(false)
  const [retryCount, setRetryCount]         = useState(0)
  const [rootPath, setRootPath]             = useState(null)   // null → multi-root tree
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [transitioning, setTransitioning]   = useState(false)

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch('/health')
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

  // After backend is ready, check whether to skip onboarding
  useEffect(() => {
    if (!backendReady) return
    fetch('/api/config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.rootPath || cfg.hasConfiguredRoots) {
          setRootPath(cfg.rootPath || null)
          setShowOnboarding(false)
        } else {
          setShowOnboarding(true)
        }
      })
      .catch(() => setShowOnboarding(true))
  }, [backendReady])

  const handleRootSelect = useCallback(async (path) => {
    setTransitioning(true)
    try {
      await fetch('/api/recents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
    } catch {}
    setRootPath(path || null)
    setShowOnboarding(false)
    setTimeout(() => setTransitioning(false), 600)
  }, [])

  const handleRetry = useCallback(() => setRetryCount(c => c + 1), [])

  if (backendError) return <BackendError onRetry={handleRetry} retryCount={retryCount} />

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

  if (showOnboarding) return <Onboarding onRootSelect={handleRootSelect} />

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: '#050508', margin: 0, padding: 0,
      opacity: transitioning ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      <Dashboard
        rootPath={rootPath}
        onChangeRoot={() => setShowOnboarding(true)}
      />
    </div>
  )
}
