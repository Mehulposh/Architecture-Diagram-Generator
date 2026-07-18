import { useCallback, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import useDiagramStore from '../store/useDiagramStore';
import { nodeTypes } from './nodes/ServiceNode';

export default function DiagramCanvas() {
  const wrapperRef = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId } = useDiagramStore();

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const bounds = wrapperRef.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/adg-node-type');
      const color = event.dataTransfer.getData('application/adg-node-color');
      if (!type) return;

      addNode({
        id: `${type}-${Date.now()}`,
        type,
        position: { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        data: { label: `New ${type}`, description: '', color },
      });
    },
    [addNode]
  );

  return (
    <div ref={wrapperRef} className="blueprint-canvas h-full w-full" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={0} color="transparent" />
        <Controls />
        <MiniMap
          nodeColor={(n) => n.data?.color || '#94A3B8'}
          maskColor="rgba(8,20,40,0.7)"
          style={{ background: '#0B1E3D' }}
        />
      </ReactFlow>
    </div>
  );
}