function getSignals(node) {
  return Object.entries(node.signals ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k)
}

function renderTree(node, lines, depth, maxDepth) {
  const indent = '  '.repeat(depth)
  const prefix = node.type === 'folder' ? 'dir' : 'file'
  const sigs = getSignals(node)
  const sigStr = sigs.length ? ` [${sigs.join(', ')}]` : ''
  lines.push(`${indent}- [${prefix}] ${node.name ?? node.path}${sigStr}`)
  if (depth < maxDepth && node.children?.length) {
    for (const child of node.children) {
      renderTree(child, lines, depth + 1, maxDepth)
    }
  }
}

export function exportMarkdown({ currentRoot, navStack, pins }) {
  const lines = []
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  lines.push('# OCTO Snapshot')
  lines.push('')
  lines.push(`> ${now} UTC`)
  lines.push('')

  if (navStack.length) {
    const pathStr = navStack
      .map(n => n.name ?? n.path?.split('/').pop() ?? '?')
      .join(' / ')
    lines.push(`**Path:** \`${pathStr}\``)
    lines.push('')
  }

  if (currentRoot) {
    lines.push(`## ${currentRoot.name ?? currentRoot.path}`)
    lines.push('')
    if (currentRoot.children?.length) {
      for (const child of currentRoot.children) {
        renderTree(child, lines, 0, 1)
      }
    }
    lines.push('')
  }

  const signalNodes = (currentRoot?.children ?? []).filter(n => getSignals(n).length > 0)
  if (signalNodes.length) {
    lines.push('## Signals')
    lines.push('')
    for (const n of signalNodes) {
      lines.push(`- **${n.name ?? n.path}**: ${getSignals(n).join(', ')}`)
    }
    lines.push('')
  }

  if (pins?.length) {
    lines.push('## Pinned')
    lines.push('')
    for (const p of pins) {
      lines.push(`- \`${p.path}\` _(${p.type})_`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function downloadMarkdown(text, filename = 'octo-snapshot.md') {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
