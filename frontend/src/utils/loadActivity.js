import { indexActivityByPath } from './activityAggregate.js'
import { apiUrl } from './api'

/**
 * Normalise raw /api/activity JSON into a usable frontend structure.
 * Pure function — testable without fetch.
 */
export function processActivityResponse(data) {
  return {
    byPath:      indexActivityByPath(data.items ?? []),
    unavailable: data.unavailable ?? null,
    generatedAt: data.generatedAt ?? null,
    root:        data.root ?? null,
  }
}

/** Fetch activity data for rootPath and return a processed result. */
export async function loadActivity(rootPath) {
  const res = await fetch(apiUrl(`/api/activity?path=${encodeURIComponent(rootPath)}`))
  if (!res.ok) throw new Error(`activity fetch failed: ${res.status}`)
  return processActivityResponse(await res.json())
}

/**
 * Summarise an activity item (file or aggregated folder) as a short label.
 * Returns one of: "edited today", "N commits this week",
 *                 "dirty + active", "dirty", "stale"
 */
export function summarizeActivity(item) {
  if (!item) return 'stale'

  const isDirty   = Boolean(item.isDirty)
  const count7d   = item.commitCount7d  ?? 0
  const count30d  = item.commitCount30d ?? 0

  if (isDirty && count7d > 0)  return 'dirty + active'
  if (isDirty)                 return 'dirty'

  if (item.lastCommitAt) {
    const ageDays = (Date.now() - new Date(item.lastCommitAt).getTime()) / 86400000
    if (ageDays < 1)    return 'edited today'
    if (count7d >= 3)   return `${count7d} commits this week`
    if (count7d > 0)    return `${count7d} commit this week`
    if (count30d > 0)   return `${count30d} commit${count30d > 1 ? 's' : ''} this month`
    if (ageDays < 30)   return 'active this month'
  }

  return 'stale'
}
