const API_BASE = 'http://localhost:7823'

export async function loadTree(depth = 2) {
  const res = await fetch(`${API_BASE}/tree?depth=${depth}`)
  if (!res.ok) throw new Error(`Failed to load tree: ${res.status}`)
  return res.json()
}

export async function loadSubtree(path, depth = 3) {
  const res = await fetch(
    `${API_BASE}/subtree?path=${encodeURIComponent(path)}&depth=${depth}`
  )
  if (!res.ok) throw new Error(`Failed to load subtree: ${path}`)
  return res.json()
}

/**
 * Opens an SSE connection to /scan.
 * Calls onProgress({ event, scanned, path, total, timestamp }) for each message.
 * Returns a promise that resolves with the complete event data.
 */
export function triggerScan(onProgress) {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${API_BASE}/scan`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      onProgress(data)
      if (data.event === 'complete') {
        es.close()
        resolve(data)
      }
    }
    es.onerror = () => {
      es.close()
      reject(new Error('SSE scan connection failed'))
    }
  })
}
