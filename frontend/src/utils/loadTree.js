export async function loadTree() {
  const res = await fetch('/tree.json')
  if (!res.ok) throw new Error('Failed to load tree.json')
  return res.json()
}
