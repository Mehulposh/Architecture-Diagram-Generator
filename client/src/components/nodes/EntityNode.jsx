import { Handle, Position } from 'reactflow';
import useDiagramStore from '../../store/useDiagramStore';

function EntityNode({ id, data, selected }) {
  const setSelectedEntityId = useDiagramStore((s) => s.setSelectedEntityId);
  const attrs = data.attributes || [];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedEntityId(id);
      }}
      className={`min-w-[220px] cursor-pointer overflow-hidden rounded-md border bg-blueprint-800/95 shadow-lg backdrop-blur-sm ${
        selected ? 'shadow-[0_0_0_2px_rgba(242,169,59,0.8)]' : 'border-blueprint-line/40'
      }`}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#F2A93B', width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: '#F2A93B', width: 7, height: 7 }} />

      <div className="border-b border-blueprint-line/40 bg-amber/10 px-3 py-1.5">
        <p className="truncate font-display text-sm font-bold text-paper">{data.name}</p>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {attrs.map((attr, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-2 px-3 py-1 text-[11px] ${
              i < attrs.length - 1 ? 'border-b border-blueprint-line/10' : ''
            }`}
          >
            <span className="flex min-w-0 items-center gap-1">
              {attr.isPrimaryKey && <span className="shrink-0 rounded-sm bg-amber/25 px-1 text-[9px] font-bold text-amber">PK</span>}
              {attr.isForeignKey && <span className="shrink-0 rounded-sm bg-node-gateway/25 px-1 text-[9px] font-bold text-node-gateway">FK</span>}
              <span className={`truncate font-mono ${attr.isPrimaryKey ? 'text-amber' : 'text-paper/85'}`}>{attr.name}</span>
            </span>
            <span className="shrink-0 font-mono text-paper/40">{attr.type}</span>
          </div>
        ))}
        {attrs.length === 0 && <p className="px-3 py-1.5 text-[11px] text-paper/30">No attributes</p>}
      </div>
    </div>
  );
}

export const erNodeTypes = { entity: EntityNode };
export default EntityNode;