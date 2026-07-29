import { useCallback, useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import useDiagramStore from '../store/useDiagramStore';
import { nodeTypes } from './nodes/ServiceNode';

export default function DiagramCanvas() {
  const wrapperRef = useRef(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNodeId } = useDiagramStore();

  // Edge color/label styling is set inline here rather than left to the
  // ".react-flow__edge-path" CSS class in index.css. In the live app both
  // work identically, but html-to-image's SVG capture (used for PNG/PDF
  // export) reliably inlines styles set directly on an element and does NOT
  // reliably pick up rules from external stylesheet classes on nested SVG
  // elements — so edges without inline styling render with the SVG spec
  // default instead (stroke: none, fill: black), which is exactly the
  // "invisible connections / solid black label boxes" export bug.
  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        style: { stroke: '#3E6FA8', strokeWidth: 1.5 },
        labelBgStyle: { fill: '#0B1E3D', fillOpacity: 1 },
        labelStyle: { fill: '#F3EFE4', fontSize: 10 },
      })),
    [edges]
  );

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
        edges={styledEdges}
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
        {/* <Controls /> */}
        <MiniMap
          nodeColor={(n) => n.data?.color || '#94A3B8'}
          maskColor="rgba(8,20,40,0.7)"
          style={{ background: '#0B1E3D' }}
        />
      </ReactFlow>
    </div>
  );
}