import {
  addHeading,
  addSubHeading,
  addImage,
  addWrappedText,
} from "./pdfHelpers";

import { resolveComponentRefs } from "../resolveRefs";

function addEntityTable(doc, entities, y) {
  if (!entities?.length) return y;

  y = addSubHeading(doc, "Entities", y);

  for (const entity of entities) {
    y = addWrappedText(
      doc,
      `• ${entity.name}`,
      y,
      10.5
    );

    if (entity.description) {
      y = addWrappedText(
        doc,
        entity.description,
        y,
        9.5
      );
    }

    if (entity.attributes?.length) {
      const attributes = entity.attributes
        .map((attr) => {
          const pk = attr.isPrimaryKey ? " [PK]" : "";
          const fk = attr.isForeignKey ? " [FK]" : "";

          return `${attr.name}: ${attr.type}${pk}${fk}`;
        })
        .join(", ");

      y = addWrappedText(
        doc,
        `Attributes: ${attributes}`,
        y,
        9
      );
    }

    y += 3;
  }

  return y;
}

function addRelationshipTable(doc, state, y) {
  if (!state.erRelationships?.length) return y;

  y = addSubHeading(doc, "Relationships", y);

  const entityMap = Object.fromEntries(
    state.erEntities.map((e) => [e.id, e.name])
  );

  state.erRelationships.forEach((rel) => {
    const source =
      entityMap[rel.source] || rel.source;

    const target =
      entityMap[rel.target] || rel.target;

    const text = `${source} → ${target} (${rel.cardinality}${
      rel.label ? `, ${rel.label}` : ""
    })`;

    y = addWrappedText(
      doc,
      text,
      y,
      9.5
    );
  });

  return y + 3;
}

export function addERSection(
  doc,
  state,
  capture,
  startY = 18
) {
  let y = startY;

  y = addHeading(
    doc,
    "Entity Relationship Diagram",
    y
  );

  y = addImage(doc, capture, y);

  if (state.erOverview) {
    y = addSubHeading(
      doc,
      "Overview",
      y
    );

    const nodes = state.erEntities.map((entity) => ({
      id: entity.id,
      data: {
        label: entity.name,
      },
    }));

    y = addWrappedText(
      doc,
      resolveComponentRefs(
        state.erOverview,
        nodes
      ),
      y
    );

    y += 3;
  }

  y = addEntityTable(
    doc,
    state.erEntities,
    y
  );

  y = addRelationshipTable(
    doc,
    state,
    y
  );

  if (state.databaseDesignDecisions) {
    y = addSubHeading(
      doc,
      "Database Design Decisions",
      y
    );

    const nodes = state.erEntities.map((entity) => ({
      id: entity.id,
      data: {
        label: entity.name,
      },
    }));

    y = addWrappedText(
      doc,
      resolveComponentRefs(
        state.databaseDesignDecisions,
        nodes
      ),
      y
    );
  }

  return y;
}