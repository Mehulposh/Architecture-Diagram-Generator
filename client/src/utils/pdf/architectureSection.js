import {
  addHeading,
  addSubHeading,
  addImage,
  addWrappedText,
  addBulletList,
} from "./pdfHelpers";

import { resolveComponentRefs } from "../resolveRefs";

function addDocumentation(doc, title, text, nodes, y) {
  if (!text) return y;

  y = addSubHeading(doc, title, y);

  const resolved = resolveComponentRefs(text, nodes);

  const lines = resolved
    .split("\n")
    .filter(Boolean);

  const isBulletList =
    lines.length > 1 &&
    lines.every((line) => line.trim().startsWith("- "));

  if (isBulletList) {
    return (
      addBulletList(
        doc,
        lines.map((line) =>
          line.replace(/^-\s*/, "")
        ),
        y
      ) + 4
    );
  }

  return addWrappedText(doc, resolved, y) + 4;
}

export function addArchitectureSection(
  doc,
  state,
  capture,
  startY = 18
) {
  let y = startY;

  y = addHeading(doc, "Architecture", y);

  y = addImage(doc, capture, y);

  const docs = state.documentation || {};

  const sections = [
    {
      title: "System Overview",
      content: docs.systemOverview,
    },

    {
      title: "Component Descriptions",
      content: docs.componentDescriptions,
    },

    {
      title: "API Flow",
      content: docs.apiFlow,
    },

    {
      title: "Database Design",
      content: docs.databaseDesign,
    },

    {
      title: "Deployment Guidelines",
      content: docs.deploymentGuidelines,
    },
  ];

  for (const section of sections) {
    y = addDocumentation(
      doc,
      section.title,
      section.content,
      state.nodes,
      y
    );
  }

  return y;
}