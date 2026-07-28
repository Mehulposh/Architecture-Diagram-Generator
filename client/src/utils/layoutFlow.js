import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

const DEFAULT_OPTIONS = {
  direction: "RIGHT",
  nodeWidth: 180,
  nodeHeight: 80,
  spacing: 80,
  layerSpacing: 140,
};

export async function layoutFlow(
  nodes,
  edges,
  options = {}
) {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const graph = {
    id: "root",

    layoutOptions: {
      "elk.algorithm": "layered",

      "elk.direction": config.direction,

      "elk.spacing.nodeNode": String(config.spacing),

      "elk.layered.spacing.nodeNodeBetweenLayers":
        String(config.layerSpacing),

      "elk.layered.spacing.edgeNodeBetweenLayers": "60",

      "elk.edgeRouting": "ORTHOGONAL",

      "elk.layered.crossingMinimization.strategy":
        "LAYER_SWEEP",

      "elk.layered.nodePlacement.strategy":
        "NETWORK_SIMPLEX",
    },

    children: nodes.map((node) => ({
      id: node.id,
      width: config.nodeWidth,
      height: config.nodeHeight,
    })),

    edges: edges.map((edge) => ({
      id:
        edge.id ??
        `${edge.source}-${edge.target}`,

      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  const layoutMap = new Map();

  layout.children.forEach((child) => {
    layoutMap.set(child.id, child);
  });

  return nodes.map((node) => {
    const position = layoutMap.get(node.id);

    return {
      ...node,

      position: {
        x: position?.x ?? 0,
        y: position?.y ?? 0,
      },

      sourcePosition:
        config.direction === "RIGHT"
          ? "right"
          : "bottom",

      targetPosition:
        config.direction === "RIGHT"
          ? "left"
          : "top",
    };
  });
}