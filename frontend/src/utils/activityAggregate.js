/**
 * Activity aggregation helpers.
 * Keeps activity data path-keyed and supports folder roll-up.
 */

/** Build a path → item lookup from the raw /api/activity items array. */
export function indexActivityByPath(items) {
  const index = {}
  for (const item of items ?? []) {
    index[item.path] = item
  }
  return index
}

/** Return the activity item for a file node, or null if unknown. */
export function getNodeActivity(node, activityIndex) {
  return activityIndex[node.path] ?? null
}

/**
 * Aggregate activity data for a folder node by rolling up all descendant
 * file activity. Returns null if no descendants are tracked.
 */
export function aggregateFolderActivity(node, activityIndex) {
  if (node.type !== 'folder') return getNodeActivity(node, activityIndex)

  const files = []
  const walk = (n) => {
    if (n.type === 'file') {
      const item = activityIndex[n.path]
      if (item) files.push(item)
    }
    for (const child of n.children ?? []) walk(child)
  }
  walk(node)

  if (!files.length) return null

  let latestAt = null
  let latestItem = null
  let count30d = 0
  let count7d  = 0
  let isDirty  = false

  for (const f of files) {
    count30d += f.commitCount30d ?? 0
    count7d  += f.commitCount7d  ?? 0
    if (f.isDirty) isDirty = true
    if (f.lastCommitAt) {
      const d = new Date(f.lastCommitAt)
      if (!latestAt || d > latestAt) {
        latestAt = d
        latestItem = f
      }
    }
  }

  return {
    path: node.path,
    relPath: node.name,
    lastCommitAt:      latestItem?.lastCommitAt      ?? null,
    lastCommitSha:     latestItem?.lastCommitSha     ?? null,
    lastCommitMessage: latestItem?.lastCommitMessage ?? null,
    author:            latestItem?.author            ?? null,
    commitCount30d:    count30d,
    commitCount7d:     count7d,
    isDirty,
    _aggregated: true,
  }
}

/**
 * Map an activity item to one of: 'hot' | 'warm' | 'cool' | 'stale' | null.
 * null  → no data
 * hot   → last commit within 24h
 * warm  → last commit within 7d
 * cool  → last commit within 30d
 * stale → older than 30d or no lastCommitAt
 */
export function getActivityLevel(item) {
  if (!item) return null
  if (!item.lastCommitAt) return 'stale'
  const ageDays = (Date.now() - new Date(item.lastCommitAt).getTime()) / 86400000
  if (ageDays < 1)  return 'hot'
  if (ageDays < 7)  return 'warm'
  if (ageDays < 30) return 'cool'
  return 'stale'
}

/**
 * Map an activity item to a 0-3 intensity score for visual / sort use.
 * 0 = none/stale, 1 = cool, 2 = warm, 3 = hot or dirty
 */
export function scoreActivity(item) {
  if (!item) return 0
  if (item.isDirty || getActivityLevel(item) === 'hot') return 3
  const lvl = getActivityLevel(item)
  if (lvl === 'warm') return 2
  if (lvl === 'cool') return 1
  return 0
}

/**
 * Classify commit frequency as a churn label.
 * Returns 'high churn' | 'steady' | 'light' | null.
 * null → no commit data available.
 *
 * Rules (deterministic, easy to modify):
 *   high churn : ≥ 5 commits this week OR ≥ 15 commits this month
 *   steady     : ≥ 2 commits this week OR ≥  5 commits this month
 *   light      : any commits in the last 30 days
 *   null       : no commits tracked
 */
export function getChurnLabel(item) {
  if (!item) return null
  const c7  = item.commitCount7d  ?? 0
  const c30 = item.commitCount30d ?? 0
  if (c7 >= 5 || c30 >= 15) return 'high churn'
  if (c7 >= 2 || c30 >= 5)  return 'steady'
  if (c30 > 0)               return 'light'
  return null
}

/**
 * Count how many of the visible scene nodes fall into each activity level.
 * Returns { hot, warm, cool, stale, unknown } counts.
 */
export function computeActivityLevelCounts(nodes, activityIndex) {
  const counts = { hot: 0, warm: 0, cool: 0, stale: 0, unknown: 0 }
  for (const node of nodes ?? []) {
    const item = node.type === 'folder'
      ? aggregateFolderActivity(node, activityIndex)
      : (activityIndex[node.path] ?? null)
    if (!item) { counts.unknown++; continue }
    const level = getActivityLevel(item)
    if (level && counts[level] !== undefined) counts[level]++
    else counts.unknown++
  }
  return counts
}

/**
 * Compute a one-line summary for the activity mode banner.
 * Operates on the currently visible layout nodes.
 */
export function computeActivitySummary(nodes, activityIndex) {
  let activeWeek = 0, dirty = 0, tracked = 0
  for (const node of nodes ?? []) {
    const item = node.type === 'folder'
      ? aggregateFolderActivity(node, activityIndex)
      : (activityIndex[node.path] ?? null)
    if (item) {
      tracked++
      if ((item.commitCount7d ?? 0) > 0) activeWeek++
      if (item.isDirty) dirty++
    }
  }
  if (!tracked) return null
  return `${activeWeek} active this week · ${dirty} dirty · ${tracked} tracked`
}
