/**
 * Utility helpers for normalizing documentation references to component ids.
 * @module utils/componentRefs
 */

// Best-effort safety net for the [[node-id]] token convention (see
// geminiService's system prompt). LLMs don't follow instructions with 100%
// reliability, so if the model writes a component's plain-text label
// directly into a documentation string instead of the token, this rewrites
// it to the proper [[node-id]] form after the fact — so renames still
// propagate correctly even when the model didn't tokenize perfectly.
/**
 * Rewrites plain component labels in documentation to the canonical [[node-id]] token form.
 * @param {object} documentation - Documentation payload to normalize.
 * @param {Array<object>} nodes - Diagram nodes to use as token sources.
 * @returns {object} Normalized documentation payload.
 */
function tokenizeDocumentation(documentation, nodes) {
  if (!documentation || !Array.isArray(nodes) || nodes.length === 0) return documentation;

  // Match longer labels first so "Auth Service" is replaced before a
  // shorter, overlapping label (e.g. "Auth") would be.
  const byLength = [...nodes].sort(
    (a, b) => (b.data?.label?.length || 0) - (a.data?.label?.length || 0)
  );

  const tokenized = {};
  for (const [key, value] of Object.entries(documentation)) {
    if (typeof value !== 'string') {
      tokenized[key] = value;
      continue;
    }
    let text = value;
    for (const node of byLength) {
      const label = node.data?.label;
      if (!label || !label.trim()) continue;
      const token = `[[${node.id}]]`;
      if (text.includes(token)) continue; // model already tokenized this one
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b${escaped}\\b`, 'g');
      text = text.replace(pattern, token);
    }
    tokenized[key] = text;
  }
  return tokenized;
}

// Guarantees every node gets at least one line in "componentDescriptions",
// regardless of whether the model actually followed the "cover every node"
// instruction. Missing components are appended using their own canvas
// "description" field, so nothing is ever silently left undocumented.
/**
 * Ensures every node is represented in component documentation.
 * @param {object} documentation - Documentation payload to enrich.
 * @param {Array<object>} nodes - Diagram nodes that need coverage.
 * @returns {object} Enriched documentation payload.
 */
function ensureComponentCoverage(documentation, nodes) {
  if (!documentation || !Array.isArray(nodes)) return documentation;

  const existing = documentation.componentDescriptions || '';
  const missing = nodes.filter((n) => !existing.includes(`[[${n.id}]]`));

  if (missing.length === 0) return documentation;

  const appended = missing
    .map((n) => `- [[${n.id}]] (${n.type}) — ${n.data?.description || 'No description generated.'}`)
    .join('\n');

  return {
    ...documentation,
    componentDescriptions: existing ? `${existing}\n${appended}` : appended,
  };
}

module.exports = { tokenizeDocumentation, ensureComponentCoverage };