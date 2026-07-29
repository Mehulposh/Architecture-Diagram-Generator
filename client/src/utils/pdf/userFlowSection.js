import {
  addHeading,
  addSubHeading,
  addImage,
  addWrappedText,
} from "./pdfHelpers";

import { resolveComponentRefs } from "../resolveRefs";

function sortNodes(nodes) {
  return [...nodes].sort((a, b) => {
    if (a.position.y !== b.position.y) {
      return a.position.y - b.position.y;
    }

    return a.position.x - b.position.x;
  });
}

function addStepTable(doc, nodes, y) {
  if (!nodes.length) return y;

  y = addSubHeading(doc, "Workflow Steps", y);

  const ordered = sortNodes(nodes);
// console.log('ordered nodes', ordered);

  ordered.forEach((node, index) => {
    const {
      label,
      description,
      stepType,
      handoffRole,
    } = node.data;

    y = addWrappedText(
      doc,
      `${index + 1}. ${label}`,
      y,
      10.5
    );

    if (description) {
      y = addWrappedText(
        doc,
        `Description: ${description}`,
        y,
        9.5
      );
    }

    y = addWrappedText(
      doc,
      `Type: ${stepType}`,
      y,
      9.5
    );

    if (handoffRole) {
      y = addWrappedText(
        doc,
        `Handoff: ${handoffRole}`,
        y,
        9.5
      );
    }

    y += 2;
  });

  return y;
}

export function addUserFlowSection(
  doc,
  state,
  captures,
  startY = 18
) {
  let y = startY;

  captures.forEach((flow, index) => {
    if (index > 0) {
      doc.addPage();
      y = startY;
    }

    y = addHeading(
      doc,
      `User Flow — ${flow.role}`,
      y
    );

    y = addImage(doc, flow.capture, y);

    if (state.userFlowOverview) {
      y = addSubHeading(
        doc,
        "Overview",
        y
      );

      const overview =
        resolveComponentRefs(
          state.userFlowOverview,
          flow.nodes
        );

      y = addWrappedText(
        doc,
        overview,
        y
      );

      y += 4;
    }

    y = addStepTable(
      doc,
      flow.nodes,
      y
    );
  });

  return y;
}