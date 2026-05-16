/**
 * Given an array of nodes, return layout positions evenly spaced
 * in a circle on the XZ plane (y = 0) at the given radius.
 */
export function buildRingLayout(children = [], radius = 4) {
  const count = children.length
  if (count === 0) return []
  return children.map((node, i) => {
    const angle = (i / count) * Math.PI * 2
    return {
      node,
      position: [
        radius * Math.cos(angle),
        0,
        radius * Math.sin(angle),
      ],
    }
  })
}
