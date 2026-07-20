import { useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import Toolbar from '../components/Toolbar';
import PromptBar from '../components/PromptBar';
import UserFlowBar from '../components/UserFlowBar';
import Sidebar from '../components/Sidebar';
import DiagramCanvas from '../components/DiagramCanvas';
import UserFlowCanvas from '../components/UserFlowCanvas';
import DocumentationPanel from '../components/DocumentationPanel';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import useDiagramStore from '../store/useDiagramStore';
import { connectSocket } from '../api/socket';

export default function Editor() {
  const { nodes, edges, token, projectId, connectRealtime, disconnectRealtime, diagramView, userFlowNodes, userFlowEdges } = useDiagramStore();

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

  const isArchitectureView = diagramView === 'architecture';

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      {isArchitectureView ? <PromptBar /> : <UserFlowBar />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="relative flex-1">
          <ReactFlowProvider>
            {isArchitectureView ? <DiagramCanvas /> : <UserFlowCanvas />}
          </ReactFlowProvider>
          {isArchitectureView && nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="spec-plate rounded border border-dashed border-blueprint-line/40 px-6 py-4 text-blueprint-line">
                Describe your application above to draft a diagram — or drag a component in from the left.
              </p>
            </div>
          )}
          {!isArchitectureView && userFlowNodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="spec-plate rounded border border-dashed border-blueprint-line/40 px-6 py-4 text-blueprint-line">
                Generate the user flow above — it reuses the roles already identified for this project.
              </p>
            </div>
          )}
        </div>
      </div>
      <footer className="spec-plate flex items-center justify-between border-t border-blueprint-line/30 bg-blueprint-950 px-5 py-1.5 text-blueprint-line">
        <span>nodes: {isArchitectureView ? nodes.length : userFlowNodes.length}</span>
        <span>edges: {isArchitectureView ? edges.length : userFlowEdges.length}</span>
        <LiveIndicator />
        <span>Blueprint — Architecture Diagram Generator</span>
      </footer>
      <DocumentationPanel />
      <NodeDetailsPanel />
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