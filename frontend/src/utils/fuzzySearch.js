import { getActiveSignals, SIGNAL_LABELS } from './signals.js'

function isSubsequence(str, query) {
  let qi = 0
  for (let si = 0; si < str.length && qi < query.length; si++) {
    if (str[si] === query[qi]) qi++
  }
  return qi === query.length
}

const SIGNAL_FILTER_MAP = {
  signals: () => true,
  git:     s => s === 'gitDirty' || s === 'gitUnpushed',
  todo:    s => s === 'todoDensity',
  large:   s => s === 'largefile',
  deep:    s => s === 'deepNesting',
}

function passesFilter(node, { signalFilter, typeFilter } = {}) {
  if (typeFilter && node.type !== typeFilter) return false
  if (signalFilter) {
    const active = getActiveSignals(node)
    const check = SIGNAL_FILTER_MAP[signalFilter]
    if (!check || !active.some(check)) return false
  }
  return true
}

/**
 * Score a single node against a query and filters.
 * Returns null if the node is excluded or unmatched.
 * Returns { score, matchReason } on match.
 */
export function scoreNode(node, query, filters = {}) {
  if (!passesFilter(node, filters)) return null

  const q = (query ?? '').toLowerCase().trim()
  if (!q) {
    return { score: node.type === 'folder' ? 2 : 1, matchReason: null }
  }

  const name          = (node.name ?? '').toLowerCase()
  const path          = (node.path ?? '').toLowerCase()
  const activeSignals = getActiveSignals(node)

  let score       = -1
  let matchReason = null

  if (name === q) {
    score = 100; matchReason = 'exact match'
  } else if (name.startsWith(q)) {
    score = 80;  matchReason = 'name match'
  } else if (name.includes(q)) {
    score = 60;  matchReason = 'name match'
  } else if (path.includes(q)) {
    score = 40;  matchReason = 'path match'
  } else if (isSubsequence(name, q)) {
    score = 20;  matchReason = 'fuzzy match'
  } else {
    // Match against signal keys or their human labels
    for (const k of activeSignals) {
      const label = (SIGNAL_LABELS[k] ?? k).toLowerCase()
      if (label.includes(q) || k.toLowerCase().includes(q)) {
        score = 15; matchReason = `signal: ${k}`; break
      }
    }
  }

  if (score === -1) return null

  if (activeSignals.length > 0) score += 10  // signal boost
  if (node.type === 'folder')    score += 5   // folder nav boost

  return { score, matchReason }
}

/**
 * Search a flat node array with fuzzy scoring.
 * Returns up to 30 results as { node, score, matchReason }, sorted best-first.
 */
export function fuzzySearch(nodes, query, filters = {}) {
  const scored = []

  for (const node of nodes) {
    const result = scoreNode(node, query, filters)
    if (!result) continue
    scored.push({ node, score: result.score, matchReason: result.matchReason })
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Folders beat files on equal score
    if (a.node.type !== b.node.type) return a.node.type === 'folder' ? -1 : 1
    // Shorter path first
    const aLen = (a.node.path ?? '').length
    const bLen = (b.node.path ?? '').length
    if (aLen !== bLen) return aLen - bLen
    // Alphabetical fallback
    return (a.node.name ?? '').localeCompare(b.node.name ?? '')
  })

  return scored.slice(0, 30)
}
