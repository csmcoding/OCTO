export function searchTree(tree, query, max = 8) {
  if (!tree || !query) return []
  const lq = query.toLowerCase()
  const results = []

  function walk(node) {
    if (results.length >= max) return
    if (node.name && node.name.toLowerCase().includes(lq)) {
      results.push(node)
    }
    if (node.children) {
      for (const child of node.children) {
        walk(child)
      }
    }
  }

  walk(tree)
  return results
}
