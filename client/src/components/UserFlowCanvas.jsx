import { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";

import useDiagramStore from "../store/useDiagramStore";
import FlowStepNode from "./nodes/FlowStepNode";
import FlowStepDetailsPanel from "./FlowStepDetailsPanel";

const nodeTypes = {
  flowStep: FlowStepNode,
};

const STEP_COLORS = {
  start: "#4CC9F0",
  action: "#8B7CF6",
  decision: "#F2A93B",
  end: "#2FB8AC",
  handoff: "#9B5DE5",
};

export default function UserFlowCanvas() {
  const wrapperRef = useRef(null);

 const {
  userFlows,
  selectedFlowRole,
  selectedFlowStepId,

  onFlowNodesChange,
  onFlowEdgesChange,
  onFlowConnect,
  addFlowStep,
  setSelectedFlowStepId,
} = useDiagramStore();

  const currentFlow = useMemo(() => {
    return (
      userFlows.find(
        (flow) => flow.role === selectedFlowRole
      ) || null
    );
  }, [userFlows, selectedFlowRole]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!wrapperRef.current) return;

      const bounds =
        wrapperRef.current.getBoundingClientRect();

      const stepType = event.dataTransfer.getData(
        "application/adg-step-type"
      );

      if (!stepType) return;

      addFlowStep({
        stepType,
        label: `New ${stepType}`,
        description: "",
        position: {
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        },
      });
    },
    [addFlowStep]
  );

  if (!currentFlow) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No user flow available.
      </div>
    );
  }

  return (
    <>
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: "100%",
      }}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <ReactFlow
        nodes={currentFlow.nodes}
        edges={currentFlow.edges}
        nodeTypes={nodeTypes}

        onNodesChange={onFlowNodesChange}
        onEdgesChange={onFlowEdgesChange}
        onConnect={onFlowConnect}

        onNodeClick={(_, node) =>
          setSelectedFlowStepId(node.id)
        }

        onPaneClick={() =>
          setSelectedFlowStepId(null)
        }

        fitView
        fitViewOptions={{
          padding: 0.2,
        }}

        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background />

        {/* <Controls /> */}

        {/* <MiniMap
          nodeColor={(node) =>
            STEP_COLORS[node.data?.stepType] ||
            "#94A3B8"
          }
          maskColor="rgba(8,20,40,0.7)"
          style={{
            background: "#0B1E3D",
          }}
        /> */}
      </ReactFlow>
    </div>

    {selectedFlowStepId && <FlowStepDetailsPanel />}
    </>
  );
}