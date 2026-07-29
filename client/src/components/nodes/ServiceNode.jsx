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
  const setSelectedNodeId = useDiagramStore((s) => s.setSelectedNodeId);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNodeId(id);
      }}
      title="Click for component details"
      className={`group relative min-w-[180px] rounded-md border bg-blueprint-800/95 px-3 py-2 shadow-lg backdrop-blur-sm transition-shadow ${
        selected
          ? 'shadow-[0_0_0_2px_rgba(242,169,59,0.8)]'
          : 'border-blueprint-line/40'
      }`}
      style={{
        borderColor: selected ? undefined : `${color}55`,
      }}
    >
      {/* Delete Button */}
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

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: color,
          width: 8,
          height: 8,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-sm"
          style={{
            background: `${color}22`,
            color,
          }}
        >
          {ICONS[type] || '●'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-paper">
            {data.label}
          </p>

          <p
            className="spec-plate truncate"
            style={{
              color: `${color}cc`,
            }}
          >
            {type}
          </p>
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-paper/60">
          {data.description}
        </p>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: color,
          width: 8,
          height: 8,
        }}
      />
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