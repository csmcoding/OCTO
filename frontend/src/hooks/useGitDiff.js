import { useState, useEffect } from 'react'
import { getActiveSignals } from '../utils/signals'
import { apiUrl } from '../utils/api'

export function useGitDiff(node) {
  const [state, setState] = useState({
    summary: null, diff: null,
    loading: false, error: null,
  })

  useEffect(() => {
    const active = node ? getActiveSignals(node) : []
    const isDirty = active.includes('gitDirty') || active.includes('gitUnpushed')

    if (!node || !isDirty || !node.path) {
      setState({ summary: null, diff: null, loading: false, error: null })
      return
    }
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))
    fetch(apiUrl(`/git-diff?path=${encodeURIComponent(node.path)}`))
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (data.error) {
          setState(s => ({ ...s, loading: false, error: data.error }))
        } else {
          setState({ summary: data.summary, diff: data.diff, loading: false, error: null })
        }
      })
      .catch(e => {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: e.message }))
      })
    return () => { cancelled = true }
  }, [node?.path, node?.dominantSignal])

  return state
}
