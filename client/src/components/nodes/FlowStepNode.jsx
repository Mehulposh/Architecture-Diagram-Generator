import { Handle, Position } from 'reactflow';

const ROLE_COLORS = ['#8B7CF6', '#2FB8AC', '#F2A93B', '#F45B69', '#4CC9F0', '#9B5DE5'];

function colorForRole(role, roleOrder) {
  const idx = roleOrder.indexOf(role);
  return ROLE_COLORS[idx % ROLE_COLORS.length] || '#94A3B8';
}

const SHAPE_CLASS = {
  start: 'rounded-full',
  end: 'rounded-full',
  decision: 'rounded-md rotate-0', // diamond look achieved via clip below
  action: 'rounded-md',
};

function FlowStepNode({ data, selected }) {
  const { label, description, role, stepType, color } = data;
  const isTerminal = stepType === 'start' || stepType === 'end';
  const isDecision = stepType === 'decision';

  return (
    <div
      className={`relative min-w-[160px] max-w-[200px] border px-3 py-2 shadow-lg backdrop-blur-sm ${SHAPE_CLASS[stepType] || 'rounded-md'} ${
        selected ? 'shadow-[0_0_0_2px_rgba(242,169,59,0.8)]' : ''
      } ${isDecision ? 'bg-blueprint-800/95' : 'bg-blueprint-800/95'}`}
      style={{
        borderColor: `${color}66`,
        borderWidth: isTerminal ? 2 : 1,
        clipPath: isDecision ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
        padding: isDecision ? '20px 24px' : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, width: 7, height: 7 }} />
      <Handle type="target" position={Position.Top} id="top" style={{ background: color, width: 7, height: 7 }} />
      <div className="flex items-center gap-1.5">
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
          style={{ background: `${color}22`, color }}
        >
          {stepType}
        </span>
      </div>
      <p className="mt-1 truncate font-display text-xs font-semibold text-paper">{label}</p>
      {description && !isDecision && (
        <p className="mt-1 text-[10px] leading-snug text-paper/50 line-clamp-2">{description}</p>
      )}
      <Handle type="source" position={Position.Right} style={{ background: color, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: color, width: 7, height: 7 }} />
    </div>
  );
}

export const flowNodeTypes = { flowStep: FlowStepNode };
export { colorForRole };
export default FlowStepNode;