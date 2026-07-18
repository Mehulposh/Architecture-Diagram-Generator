// Documentation text (and, in future phases, ER/user-flow docs) never store a
// component's name directly — it stores a [[node-id]] token. That token is
// resolved to the component's *current* label right here, at render/export
// time, using whatever nodes are live on the canvas. This is the entire
// reason renaming a component doesn't leave stale names scattered through
// generated prose: there's nothing to go stale, because the name was never
// actually stored in the text.
const REF_PATTERN = /\[\[([a-zA-Z0-9_-]+)\]\]/g;

export function resolveComponentRefs(text, nodes) {
  if (typeof text !== 'string' || !text) return text;
  const byId = Object.fromEntries((nodes || []).map((n) => [n.id, n]));

  return text.replace(REF_PATTERN, (match, id) => {
    const node = byId[id];
    return node ? node.data?.label || match : '(removed component)';
  });
}

export function resolveDocumentation(documentation, nodes) {
  if (!documentation) return documentation;
  const resolved = {};
  for (const [key, value] of Object.entries(documentation)) {
    resolved[key] = typeof value === 'string' ? resolveComponentRefs(value, nodes) : value;
  }
  return resolved;
}

// Resolves an array of node ids (e.g. data.communicatesWith) to their current
// labels. Same rationale as resolveComponentRefs: IDs are the stored source
// of truth, never names, so this always reflects the live canvas.
export function resolveIdList(ids, nodes) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const byId = Object.fromEntries((nodes || []).map((n) => [n.id, n]));
  return ids
    .map((id) => (byId[id] ? { id, label: byId[id].data?.label || id } : null))
    .filter(Boolean);
}

// Used to warn the user when a narrative doc section references a component
// that no longer exists (deleted, not just renamed) — renamed components
// resolve fine automatically, but deleted ones can't.
export function findBrokenRefs(text, nodes) {
  if (typeof text !== 'string' || !text) return [];
  const ids = new Set((nodes || []).map((n) => n.id));
  const broken = [];
  let match;
  REF_PATTERN.lastIndex = 0;
  while ((match = REF_PATTERN.exec(text)) !== null) {
    if (!ids.has(match[1])) broken.push(match[1]);
  }
  return broken;
}