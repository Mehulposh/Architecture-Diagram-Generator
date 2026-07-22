import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Toolbar from '../components/Toolbar';
import PromptBar from '../components/PromptBar';
import UserFlowBar from '../components/UserFlowBar';
import ERBar from '../components/ERBar';
import Sidebar from '../components/Sidebar';
import DiagramCanvas from '../components/DiagramCanvas';
import UserFlowCanvas from '../components/UserFlowCanvas';
import ERCanvas from '../components/ERCanvas';
import DocumentationPanel from '../components/DocumentationPanel';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import EntityDetailsPanel from '../components/EntityDetailsPanel';
import useDiagramStore from '../store/useDiagramStore';
import { connectSocket } from '../api/socket';

const VIEW_BAR = { architecture: PromptBar, userFlow: UserFlowBar, er: ERBar };
const VIEW_CANVAS = { architecture: DiagramCanvas, userFlow: UserFlowCanvas, er: ERCanvas };
const EMPTY_MESSAGE = {
  architecture: 'Describe your application above to draft a diagram — or drag a component in from the left.',
  userFlow: 'Generate the user flow above — it reuses the roles already identified for this project.',
  er: 'Generate the ER diagram above — it reuses the domain analysis already identified for this project.',
};

export default function Editor() {
  const { nodes, edges, token, projectId, connectRealtime, disconnectRealtime, diagramView, userFlowNodes, userFlowEdges, erEntities, erRelationships } =
    useDiagramStore();

  // Open the socket connection once per session.
  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  // Join the project's collaboration room whenever we land on a saved project,
  // and leave it when we navigate away or switch to a different one.
  useEffect(() => {
    if (!projectId) return;
    connectRealtime();
    return () => disconnectRealtime();
  }, [projectId]);

  const ViewBar = VIEW_BAR[diagramView] || PromptBar;
  const ViewCanvas = VIEW_CANVAS[diagramView] || DiagramCanvas;

  const counts = {
    architecture: { nodes: nodes.length, edges: edges.length },
    userFlow: { nodes: userFlowNodes.length, edges: userFlowEdges.length },
    er: { nodes: erEntities.length, edges: erRelationships.length },
  }[diagramView] || { nodes: 0, edges: 0 };

  const isEmpty = {
    architecture: nodes.length === 0,
    userFlow: userFlowNodes.length === 0,
    er: erEntities.length === 0,
  }[diagramView];

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <ViewBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="relative flex-1">
          <ReactFlowProvider>
            <ViewCanvas />
          </ReactFlowProvider>
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="spec-plate rounded border border-dashed border-blueprint-line/40 px-6 py-4 text-blueprint-line">
                {EMPTY_MESSAGE[diagramView]}
              </p>
            </div>
          )}
        </div>
      </div>
      <footer className="spec-plate flex items-center justify-between border-t border-blueprint-line/30 bg-blueprint-950 px-5 py-1.5 text-blueprint-line">
        <span>{diagramView === 'er' ? 'entities' : 'nodes'}: {counts.nodes}</span>
        <span>{diagramView === 'er' ? 'relationships' : 'edges'}: {counts.edges}</span>
        <LiveIndicator />
        <span>Blueprint — Architecture Diagram Generator</span>
      </footer>
      <DocumentationPanel />
      <NodeDetailsPanel />
      <EntityDetailsPanel />
    </div>
  );
}

function LiveIndicator() {
  const projectId = useDiagramStore((s) => s.projectId);
  const othersOnline = useDiagramStore((s) => s.collaboratorsOnline.length);

  // Presence from the server only ever lists *other* people (it's broadcast
  // to everyone except the sender) — so include yourself once you're
  // actually connected to a project's room.
  const count = projectId ? othersOnline + 1 : 0;
  if (count === 0) return <span />;

  return (
    <span className="flex items-center gap-1.5 text-amber">
      <span className="h-1.5 w-1.5 rounded-full bg-amber" />
      {count} {count === 1 ? 'collaborator' : 'collaborators'} online
    </span>
  );
}