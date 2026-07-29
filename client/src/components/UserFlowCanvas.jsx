// import { useCallback, useMemo, useRef , useEffect  } from 'react';
// import { useNodesInitialized , useNodesState, useEdgesState } from "reactflow";
// import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
// import 'reactflow/dist/style.css';
// import useDiagramStore from '../store/useDiagramStore';
// import { flowNodeTypes } from './nodes/FlowStepNode';

// const STEP_COLORS = {
//   start: '#4CC9F0',
//   action: '#8B7CF6',
//   decision: '#F2A93B',
//   end: '#2FB8AC',
//   handoff: '#9B5DE5',
// };

// export default function UserFlowCanvas() {
// const nodesInitialized = useNodesInitialized();

// const [nodes, setNodes, onNodesChange] = useNodesState([]);
// const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//   const wrapperRef = useRef(null);
//   const {
//     userFlows,
//     selectedFlowRole,
//     onFlowNodesChange,
//     onFlowEdgesChange,
//     onFlowConnect,
//     addFlowStep,
//     setSelectedFlowStepId,
//   } = useDiagramStore();

//   const currentFlow = userFlows.find((f) => f.role === selectedFlowRole);

//   // const flowNodes = useMemo(
//   //   () =>
//   //     (currentFlow?.nodes || []).map((n) => ({
//   //       id: n.id,
//   //       type: 'flowStep',
//   //       position: n.position || { x: 0, y: 0 },
//   //       data: { label: n.label, description: n.description, stepType: n.stepType, handoffRole: n.handoffRole },
//   //     })),
//   //   [currentFlow]
//   // );
  
//   const flowNodes = useMemo(() =>
//     (currentFlow?.nodes || []).map((n) => ({
//       id: n.id,
//       type: "default",
//       position: n.position,
//       data: {
//         label: n.label,
//       },
//     })),
//   [currentFlow]
// );

//   useEffect(() => {
//     console.log("Nodes initialized:", nodesInitialized);
// }, [nodesInitialized]);

//   useEffect(() => {
//   setNodes(flowNodes);
// }, [flowNodes]);

//   console.log('first flow node',flowNodes[0]);
  
//   const flowEdges = useMemo(
//     () =>
//       (currentFlow?.edges || []).map((e) => ({
//         ...e,
//         style: { stroke: '#3E6FA8' },
//         labelBgStyle: { fill: '#0B1E3D' },
//         labelStyle: { fill: '#F3EFE4', fontSize: 10 },
//       })),
//     [currentFlow]
//   );

//   useEffect(() => {
//   setEdges(flowEdges);
// }, [flowEdges]);

//   const onDrop = useCallback(
//     (event) => {
//       event.preventDefault();
//       const bounds = wrapperRef.current.getBoundingClientRect();
//       const stepType = event.dataTransfer.getData('application/adg-step-type');
//       if (!stepType) return;

//       addFlowStep({
//         stepType,
//         label: `New ${stepType}`,
//         description: '',
//         position: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
//       });
//     },
//     [addFlowStep]
//   );

//   if (!currentFlow) {
//     return <div className="blueprint-canvas h-full w-full" />;
//   }

// //   console.log("UserFlows:", userFlows);
// // console.log("Selected:", selectedFlowRole);
// // console.log("Current:", currentFlow);
// // console.log("Nodes:", currentFlow?.nodes);
// // console.log("Edges:", currentFlow?.edges);

//   return (
//     <div 
//       ref={wrapperRef} 
//       className="blueprint-canvas" 
//       style={{
//         width: "100%",
//         height: "100%",
//       }} 
//       onDrop={onDrop} 
//       onDragOver={(e) => e.preventDefault()}>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         // nodeTypes={flowNodeTypes}
//         onNodesChange={onFlowNodesChange}
//         onEdgesChange={onFlowEdgesChange}
//         onConnect={onFlowConnect}
//         onNodeClick={(_, node) => setSelectedFlowStepId(node.id)}
//         onPaneClick={() => setSelectedFlowStepId(null)}
//         fitView={false}
//         defaultViewport={{
//           x: 0,
//           y: 0,
//           zoom: 1,
//         }}
//         proOptions={{ hideAttribution: true }}
//       >
//         <Background variant={BackgroundVariant.Dots} gap={28} size={0} color="transparent" />
//         <Controls />
//         <MiniMap
//           nodeColor={(n) => STEP_COLORS[n.data?.stepType] || '#94A3B8'}
//           maskColor="rgba(8,20,40,0.7)"
//           style={{ background: '#0B1E3D' }}
//         />
//       </ReactFlow>

//       {/* <div className="absolute top-2 left-2 z-50 bg-red-500 text-white p-2">
//         {JSON.stringify({
//           selectedFlowRole,
//           flows: userFlows.length,
//           nodes: currentFlow?.nodes?.length,
//           edges: currentFlow?.edges?.length,
//         })}
//       </div> */}
//     </div>
//   );
// }




import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";

import useDiagramStore  from "../store/useDiagramStore";
import FlowStepNode from "./nodes/FlowStepNode";

const nodeTypes = {
  flowStep: FlowStepNode,
};

export default function UserFlowCanvas() {
  const {
    userFlows,
    selectedFlowRole,
  } = useDiagramStore();

  const currentFlow = useMemo(() => {
    return (
      userFlows.find(
        (flow) => flow.role === selectedFlowRole
      ) || null
    );
  }, [userFlows, selectedFlowRole]);

  if (!currentFlow) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No user flow available.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={currentFlow.nodes}
        edges={currentFlow.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background />
        {/* <MiniMap /> */}
        {/* <Controls /> */}
      </ReactFlow>
    </div>
  );
}