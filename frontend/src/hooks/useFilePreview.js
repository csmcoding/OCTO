import { useState, useEffect } from 'react'
import { apiUrl } from '../utils/api'

export function buildPreviewUrl(path, lines = 60) {
  return apiUrl(`/preview?path=${encodeURIComponent(path)}&lines=${lines}`)
}

export function shouldFetchPreview(node) {
  return !!(node && node.type === 'file' && node.path)
}

export function useFilePreview(node) {
  const [state, setState] = useState({
    lines: null, language: 'text',
    truncated: false, total: 0,
    loading: false, error: null,
  })

  useEffect(() => {
    if (!shouldFetchPreview(node)) {
      setState({ lines: null, language: 'text', truncated: false, total: 0, loading: false, error: null })
      return
    }
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))
    fetch(buildPreviewUrl(node.path))
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) {
          setState(s => ({ ...s, loading: false, error: data.error }))
        } else {
          setState({
            lines: data.lines,
            language: data.language,
            truncated: data.truncated,
            total: data.total,
            loading: false, error: null,
          })
        }
      })
      .catch(e => {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: e.message }))
      })
    return () => { cancelled = true }
  }, [node?.path])

  return state
}
