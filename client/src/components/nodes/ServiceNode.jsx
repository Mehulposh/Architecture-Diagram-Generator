import { useEffect, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import useDiagramStore from '../../store/useDiagramStore';

const ICONS = {
  frontend: '▣',
  backend: '◧',
  database: '▤',
  cache: '◈',
  queue: '≋',
  'api-gateway': '◎',
  'load-balancer': '⇶',
  cloud: '☁',
  external: '⬡',
};

function ServiceNode({ id, data, type, selected }) {
  const color = data.color || '#94A3B8';
  const deleteNode = useDiagramStore((s) => s.deleteNode);
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      setDraft(data.label);
      // Wait a tick so the input exists before focusing.
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== data.label) {
      // Every documentation string references this node by [[id]], never by
      // name, so this single update is all that's needed for the rename to
      // propagate everywhere: the diagram, descriptions, docs, and exports.
      updateNodeData(id, { label: trimmed });
    }
    setEditing(false);
  };

  return (
    <div
      className={`group relative min-w-[180px] rounded-md border bg-blueprint-800/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-shadow ${
        selected ? 'shadow-[0_0_0_2px_rgba(242,169,59,0.8)]' : 'border-blueprint-line/40'
      }`}
      style={{ borderColor: selected ? undefined : `${color}55` }}
    >
      <button
        type="button"
        title="Delete component"
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(id);
        }}
        className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-blueprint-line/40 bg-blueprint-900 text-[11px] leading-none text-paper/50 opacity-0 transition-opacity hover:border-node-cache hover:text-node-cache group-hover:opacity-100"
      >
        ×
      </button>
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8 }} />
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-sm" style={{ background: `${color}22`, color }}>
          {ICONS[type] || '●'}
        </span>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="nodrag w-full rounded-sm border border-amber/60 bg-blueprint-900 px-1 py-0.5 font-display text-sm font-semibold text-paper outline-none"
            />
          ) : (
            <p
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              title="Double-click to rename"
              className="truncate font-display text-sm font-semibold text-paper"
            >
              {data.label}
            </p>
          )}
          <p className="spec-plate truncate" style={{ color: `${color}cc` }}>{type}</p>
        </div>
      </div>
      {data.description && (
        <p className="mt-1.5 text-xs leading-snug text-paper/60 line-clamp-2">{data.description}</p>
      )}
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8 }} />
    </div>
  );
}

export const nodeTypes = {
  frontend: ServiceNode,
  backend: ServiceNode,
  database: ServiceNode,
  cache: ServiceNode,
  queue: ServiceNode,
  'api-gateway': ServiceNode,
  'load-balancer': ServiceNode,
  cloud: ServiceNode,
  external: ServiceNode,
};

export default ServiceNode;