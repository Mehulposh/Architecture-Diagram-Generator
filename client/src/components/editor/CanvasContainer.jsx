import { ReactFlowProvider } from "reactflow";

import useDiagramStore from "../../store/useDiagramStore";

import DiagramCanvas from "../DiagramCanvas";
import UserFlowCanvas from "../UserFlowCanvas";
import ERCanvas from "../ERCanvas";

import EmptyState from "./EmptyState";

export default function CanvasContainer() {
  const diagramView = useDiagramStore((s) => s.diagramView);

  const nodes = useDiagramStore((s) => s.nodes);
  const userFlowNodes = useDiagramStore((s) => s.userFlowNodes);
  const erEntities = useDiagramStore((s) => s.erEntities);

  const VIEW_CONFIG = {
    architecture: {
      component: DiagramCanvas,
      empty: nodes.length === 0,
    },

    userFlow: {
      component: UserFlowCanvas,
      empty: userFlowNodes.length === 0,
    },

    er: {
      component: ERCanvas,
      empty: erEntities.length === 0,
    },
  };

  const current = VIEW_CONFIG[diagramView] ?? VIEW_CONFIG.architecture;

  const Canvas = current.component;
  const isEmpty = current.empty;

  return (
    <div className="relative flex-1">
      <ReactFlowProvider>
        <Canvas />

        {isEmpty && <EmptyState />}
      </ReactFlowProvider>
    </div>
  );
}