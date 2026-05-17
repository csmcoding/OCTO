import { useState } from 'react'
import ThreeScene from './ThreeScene'
import ScanButton from './ScanButton'
import ScanTimestamp from './ScanTimestamp'
import { loadTree } from '../utils/loadTree'

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [scannedAt, setScannedAt] = useState(null)
  const [treeData, setTreeData] = useState(null)

  const handleScanComplete = () => {
    loadTree(2).then(data => {
      setTreeData(data)
      setScannedAt(new Date())
    }).catch(console.error)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <ThreeScene treeData={treeData} onLoadingChange={setLoading} />
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          color: '#4A90D9',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          padding: '12px 20px',
          borderRadius: 6,
          pointerEvents: 'none',
        }}>
          loading subtree...
        </div>
      )}
      <ScanButton onScanComplete={handleScanComplete} />
      <ScanTimestamp scannedAt={scannedAt} />
    </div>
  )
}
