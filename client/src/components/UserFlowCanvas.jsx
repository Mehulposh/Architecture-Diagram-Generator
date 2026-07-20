import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import useDiagramStore from '../store/useDiagramStore';
import { flowNodeTypes, colorForRole } from './nodes/FlowStepNode';
import LaneNode from './nodes/LaneNode';

const nodeTypes = { ...flowNodeTypes, lane: LaneNode };
const LANE_HEIGHT = 200;
const LANE_WIDTH = 2200;

export default function UserFlowCanvas() {
  const { userFlowNodes, userFlowEdges } = useDiagramStore();

  const { flowNodes, flowEdges } = useMemo(() => {
    const roleOrder = [...new Set(userFlowNodes.map((n) => n.role || 'User'))];

    const laneNodes = roleOrder.map((role, i) => ({
      id: `lane-${role}`,
      type: 'lane',
      position: { x: -40, y: i * LANE_HEIGHT - 30 },
      data: { role, color: colorForRole(role, roleOrder) },
      draggable: false,
      selectable: false,
      zIndex: -1,
      style: { width: LANE_WIDTH, height: LANE_HEIGHT },
    }));

    const stepNodes = userFlowNodes.map((n) => ({
      id: n.id,
      type: 'flowStep',
      position: n.position || { x: 0, y: 0 },
      data: {
        label: n.label,
        description: n.description,
        role: n.role,
        stepType: n.stepType,
        color: colorForRole(n.role, roleOrder),
      },
    }));

    const edges = userFlowEdges.map((e) => ({
      ...e,
      style: { stroke: '#3E6FA8' },
      labelBgStyle: { fill: '#0B1E3D' },
      labelStyle: { fill: '#F3EFE4', fontSize: 10 },
    }));

    return { flowNodes: [...laneNodes, ...stepNodes], flowEdges: edges };
  }, [userFlowNodes, userFlowEdges]);

  return (
    <div className="blueprint-canvas h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={0} color="transparent" />
        <Controls />
        <MiniMap
          nodeColor={(n) => n.data?.color || '#3E6FA8'}
          maskColor="rgba(8,20,40,0.7)"
          style={{ background: '#0B1E3D' }}
        />
      </ReactFlow>
    </div>
  );
}