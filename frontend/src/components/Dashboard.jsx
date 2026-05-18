import { useState } from 'react'
import ThreeScene from './ThreeScene'
import ScanButton from './ScanButton'
import ScanTimestamp from './ScanTimestamp'
import OctoWordmark from './OctoWordmark'
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ThreeScene treeData={treeData} onLoadingChange={setLoading} />
      {loading && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          color: '#7c9df5',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 200,
          background: 'rgba(3,3,10,0.85)',
          padding: '12px 20px',
          borderRadius: 6,
          pointerEvents: 'none',
        }}>
          loading subtree...
        </div>
      )}
      <OctoWordmark />
      <ScanButton onScanComplete={handleScanComplete} />
      <ScanTimestamp scannedAt={scannedAt} />
    </div>
  )
}
