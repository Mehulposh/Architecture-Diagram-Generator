import useDiagramStore from "../../store/useDiagramStore";
import LiveIndicator from "./LiveIndicator";

export default function Footer() {
  const diagramView = useDiagramStore(
    (s) => s.diagramView
  );

  const nodes = useDiagramStore(
    (s) => s.nodes.length
  );

  const edges = useDiagramStore(
    (s) => s.edges.length
  );

  const userFlowNodes = useDiagramStore(
    (s) => s.userFlowNodes.length
  );

  const userFlowEdges = useDiagramStore(
    (s) => s.userFlowEdges.length
  );

  const erEntities = useDiagramStore(
    (s) => s.erEntities.length
  );

  const erRelationships = useDiagramStore(
    (s) => s.erRelationships.length
  );

  const counts = {
    architecture: {
      nodes,
      edges,
    },

    userFlow: {
      nodes: userFlowNodes,
      edges: userFlowEdges,
    },

    er: {
      nodes: erEntities,
      edges: erRelationships,
    },
  }[diagramView];

  return (
    <footer className="spec-plate flex items-center justify-between border-t border-blueprint-line/30 bg-blueprint-950 px-5 py-1.5 text-blueprint-line">

      <span>

        {diagramView === "er"
          ? "entities"
          : "nodes"}

        : {counts.nodes}

      </span>

      <span>

        {diagramView === "er"
          ? "relationships"
          : "edges"}

        : {counts.edges}

      </span>

      <LiveIndicator />

      <span>

        Blueprint — Architecture Diagram Generator

      </span>

    </footer>
  );
}