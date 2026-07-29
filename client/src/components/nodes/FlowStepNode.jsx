import { Handle, Position } from "reactflow";
import useDiagramStore from "../../store/useDiagramStore";

const STEP_COLORS = {
  start: "#4CC9F0",
  action: "#8B7CF6",
  decision: "#F2A93B",
  end: "#2FB8AC",
  handoff: "#9B5DE5",
};

function FlowStepNode({ id, data, selected }) {
  const { label, description, stepType, handoffRole } = data;

  const color = STEP_COLORS[stepType] || "#94A3B8";
  const isTerminal = stepType === "start" || stepType === "end";
  const isDecision = stepType === "decision";

  const setSelectedFlowStepId = useDiagramStore(
    (s) => s.setSelectedFlowStepId
  );

  const deleteFlowStep = useDiagramStore(
    (s) => s.deleteFlowStep
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedFlowStepId(id);
      }}
      title="Click for details"
      className={`group relative min-w-[170px] max-w-[210px] cursor-pointer border px-3 py-2 shadow-lg backdrop-blur-sm ${
        isDecision
          ? "rounded-md"
          : isTerminal
          ? "rounded-full"
          : "rounded-md"
      } ${
        selected
          ? "shadow-[0_0_0_2px_rgba(242,169,59,0.8)]"
          : ""
      } bg-blueprint-800/95`}
      style={{
        borderColor: `${color}66`,
        borderWidth: isTerminal ? 2 : 1,
        clipPath: isDecision
          ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          : undefined,
        padding: isDecision ? "20px 24px" : undefined,
      }}
    >
      <button
        type="button"
        title="Delete step"
        onClick={(e) => {
          e.stopPropagation();
          deleteFlowStep(id);
        }}
        className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-blueprint-line/40 bg-blueprint-900 text-[11px] leading-none text-paper/50 opacity-0 transition-opacity hover:border-node-cache hover:text-node-cache group-hover:opacity-100"
      >
        ×
      </button>

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: color,
          width: 7,
          height: 7,
        }}
      />

      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: color,
          width: 7,
          height: 7,
        }}
      />

      <div className="flex items-center gap-1.5">
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
          style={{
            background: `${color}22`,
            color,
          }}
        >
          {stepType}
        </span>

        {stepType === "handoff" && handoffRole && (
          <span className="truncate rounded-sm bg-node-gateway/20 px-1.5 py-0.5 text-[9px] font-semibold text-node-gateway">
            ↔ {handoffRole}
          </span>
        )}
      </div>

      <p className="mt-1 truncate font-display text-xs font-semibold text-paper">
        {label}
      </p>

      {description && !isDecision && (
        <p className="mt-1 text-[10px] leading-snug text-paper/50 line-clamp-2">
          {description}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: color,
          width: 7,
          height: 7,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: color,
          width: 7,
          height: 7,
        }}
      />
    </div>
  );
}

export const flowNodeTypes = {
  flowStep: FlowStepNode,
};

export default FlowStepNode;