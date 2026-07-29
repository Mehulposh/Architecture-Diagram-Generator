import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import useDiagramStore from '../store/useDiagramStore';
import { erNodeTypes } from './nodes/EntityNode';

export default function ERCanvas() {
  const { erEntities, erRelationships, setSelectedEntityId } = useDiagramStore();

  const { flowNodes, flowEdges } = useMemo(() => {
    const nodes = erEntities.map((entity) => ({
      id: entity.id,
      type: 'entity',
      position: entity.position || { x: 0, y: 0 },
      data: { name: entity.name, attributes: entity.attributes || [] },
    }));

    const edges = erRelationships.map((rel) => ({
      id: rel.id,
      source: rel.source,
      target: rel.target,
      label: `${rel.label || ''}  (${rel.cardinality || '?'})`.trim(),
      style: { stroke: rel.isJunctionTable ? '#9B5DE5' : '#3E6FA8', strokeDasharray: rel.isJunctionTable ? '4 3' : undefined },
      labelBgStyle: { fill: '#0B1E3D' },
      labelStyle: { fill: '#F3EFE4', fontSize: 10 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3E6FA8', width: 14, height: 14 },
    }));

    return { flowNodes: nodes, flowEdges: edges };
  }, [erEntities, erRelationships]);

  return (
    <div className="blueprint-canvas h-full w-full">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={erNodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => setSelectedEntityId(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={0} color="transparent" />
        {/* <Controls /> */}
        {/* <MiniMap nodeColor={() => '#F2A93B'} maskColor="rgba(8,20,40,0.7)" style={{ background: '#0B1E3D' }} /> */}
      </ReactFlow>
    </div>
  );
}