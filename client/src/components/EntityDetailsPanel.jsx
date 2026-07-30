import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import useDiagramStore from "../store/useDiagramStore";

const DATA_TYPES = [
  "UUID",
  "ObjectId",
  "String",
  "Text",
  "Number",
  "Integer",
  "Float",
  "Boolean",
  "Date",
  "DateTime",
  "JSON",
  "Array",
];

const CARDINALITIES = [
  "1:1",
  "1:N",
  "N:1",
  "N:N",
];

export default function EntityDetailsPanel() {
  const {
    erEntities,
    erRelationships,
    selectedEntityId,

    setSelectedEntityId,

    updateEntityData,
    updateEntityAttribute,
    addEntityAttribute,
    deleteEntityAttribute,

    deleteEntity,

    updateRelationship,
    deleteRelationship,
  } = useDiagramStore();

  const [expandedAttributes, setExpandedAttributes] = useState({});

  const entity = erEntities.find(
    (e) => e.id === selectedEntityId
  );

  if (!entity) return null;

  const relationships = erRelationships.filter(
    (r) =>
      r.source === entity.id ||
      r.target === entity.id
  );

  const entityById = Object.fromEntries(
    erEntities.map((e) => [e.id, e])
  );

  const toggleAttribute = (id) => {
    setExpandedAttributes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        className="flex-1 bg-blueprint-950/60 backdrop-blur-sm"
        onClick={() => setSelectedEntityId(null)}
      />
      <div className="flex h-full w-full max-w-md flex-col border-l border-blueprint-line/30 bg-blueprint-900 shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div>
            <p className="spec-plate mb-1 text-amber">
              entity
            </p>
            <h2 className="font-display text-lg font-bold text-paper">
              {entity.name}
            </h2>
          </div>
          <button
            onClick={() => setSelectedEntityId(null)}
            className="rounded border border-blueprint-line/30 px-3 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ===================================== */}
          {/* ENTITY INFO */}
          {/* ===================================== */}

          <section className="mb-6">
            <p className="spec-plate mb-3 text-blueprint-line">
              Entity Information
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-paper/60">
                  Name
                </label>
              
                <input
                  value={entity.name}
                  onChange={(e) =>
                    updateEntityData(entity.id, {
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded border border-blueprint-line/30 bg-blueprint-800 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-paper/60">
                  Purpose
                </label>

                <textarea
                  rows={4}
                  value={entity.purpose || ""}
                  onChange={(e) =>
                    updateEntityData(entity.id, {
                      purpose: e.target.value,
                    })
                  }
                  className="w-full resize-none rounded border border-blueprint-line/30 bg-blueprint-800 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                />
              </div>
            </div>
          </section>

          {/* ===================================== */}
          {/* ATTRIBUTES */}
          {/* ===================================== */}

          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="spec-plate text-blueprint-line">
                Attributes
              </p>
              <button
                onClick={() => addEntityAttribute(entity.id)}
                className="flex items-center gap-1 rounded border border-blueprint-line/30 px-2 py-1 text-xs hover:bg-blueprint-800"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="space-y-3">
              {entity.attributes.map((attr) => {
                const expanded = expandedAttributes[attr.id];

                return (
                  <div
                    key={attr.id}
                    className="overflow-hidden rounded border border-blueprint-line/30"
                  >
                    {/* ATTRIBUTE HEADER */}
                    <div
                      onClick={() => toggleAttribute(attr.id) }
                      className="flex w-full items-center justify-between bg-blueprint-800 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? (
                          <ChevronDown size={15} />
                        ) : (
                          <ChevronRight size={15} />
                        )}
                        <span className="font-mono text-sm text-paper">
                          {attr.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEntityAttribute(
                            entity.id,
                            attr.id
                          );
                        }}
                        className="rounded p-1 hover:bg-red-500/20"
                      >
                        <Trash2
                          size={14}
                          className="text-red-400"
                        />
                      </button>

                    </div>

                    {expanded && (
                      <div className="space-y-4 p-3">                       
                       {/* Name */}
                        <div>
                          <label className="mb-1 block text-xs text-paper/60">
                            Attribute Name
                          </label>
                          <input
                            value={attr.name}
                            onChange={(e) =>
                              updateEntityAttribute(
                                entity.id,
                                attr.id,
                                {
                                  name: e.target.value,
                                }
                              )
                            }
                            className="w-full rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                          />
                        </div>
                        {/* Type */}
                        <div>
                          <label className="mb-1 block text-xs text-paper/60">
                            Data Type
                          </label>
                          <select
                            value={attr.type}
                            onChange={(e) =>
                              updateEntityAttribute(
                                entity.id,
                                attr.id,
                                {
                                  type: e.target.value,
                                }
                              )
                            }
                            className="w-full rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                          >
                            {DATA_TYPES.map((type) => (
                              <option
                                key={type}
                                value={type}
                              >
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Description */}
                        <div>
                          <label className="mb-1 block text-xs text-paper/60">
                            Description
                          </label>
                          <textarea
                            rows={3}
                            value={attr.description || ""}
                            onChange={(e) =>
                              updateEntityAttribute(
                                entity.id,
                                attr.id,
                                {
                                  description: e.target.value,
                                }
                              )
                            }
                            className="w-full resize-none rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                          />
                        </div>
                        {/* Flags */}
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 rounded border border-blueprint-line/20 p-2 text-xs">
                            <input
                              type="checkbox"
                              checked={ attr.isPrimaryKey}
                              onChange={(e) =>
                                updateEntityAttribute(
                                  entity.id,
                                  attr.id,
                                  {
                                    isPrimaryKey: e.target.checked,
                                  }
                                )
                              }
                            />
                            Primary Key
                          </label>

                          <label className="flex items-center gap-2 rounded border border-blueprint-line/20 p-2 text-xs">
                            <input
                              type="checkbox"
                              checked={ attr.isForeignKey }
                              onChange={(e) =>
                                updateEntityAttribute(
                                  entity.id,
                                  attr.id,
                                  {
                                    isForeignKey: e.target.checked,
                                  }
                                )
                              }
                            />
                            Foreign Key
                          </label>

                          <label className="flex items-center gap-2 rounded border border-blueprint-line/20 p-2 text-xs">
                            <input
                              type="checkbox"
                              checked={ attr.required }
                              onChange={(e) =>
                                updateEntityAttribute(
                                  entity.id,
                                  attr.id,
                                  {
                                    required: e.target.checked,
                                  }
                                )
                              }
                            />
                            Required
                          </label>

                          <label className="flex items-center gap-2 rounded border border-blueprint-line/20 p-2 text-xs">
                            <input
                              type="checkbox"
                              checked={attr.unique }
                              onChange={(e) =>
                                updateEntityAttribute(
                                  entity.id,
                                  attr.id,
                                  {
                                    unique: e.target.checked,
                                  }
                                )
                              }
                            />
                            Unique
                          </label>
                        </div>
                        {/* FK Reference */}
                        {attr.isForeignKey && (
                          <div>
                            <label className="mb-1 block text-xs text-paper/60">
                              References Entity
                            </label>
                            <select
                              value={attr.foreignKeyRef || "" }
                              onChange={(e) =>
                                updateEntityAttribute(
                                  entity.id,
                                  attr.id,
                                  {
                                    foreignKeyRef: e.target.value,
                                  }
                                )
                              }
                              className="w-full rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                            >
                              <option value="">
                                Select Entity
                              </option>
                              {erEntities
                                .filter((e) => e.id !== entity.id )
                                .map((e) => (
                                  <option
                                    key={e.id}
                                    value={e.id}
                                  >
                                    {e.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          {/* ===================================== */}
          {/* RELATIONSHIPS */}
          {/* ===================================== */}
          {relationships.length > 0 && (
            <section className="mb-6">
              <p className="spec-plate mb-3 text-blueprint-line">
                Relationships
              </p>
              <div className="space-y-4">
                {relationships.map((rel) => {
                  const otherId = rel.source === entity.id
                      ? rel.target
                      : rel.source;
                  const otherEntity = entityById[otherId];
                  return (
                    <div
                      key={rel.id}
                      className="rounded border border-blueprint-line/30 bg-blueprint-800/40 p-3"
                    >
                      <button
                        onClick={() => otherEntity && setSelectedEntityId(otherId) }
                        className="mb-3 font-display text-sm font-semibold text-amber hover:underline"
                      >
                        {otherEntity?.name || "Unknown Entity"}
                      </button>
                      {/* Relationship Label */}
                      <div className="mb-3">
                        <label className="mb-1 block text-xs text-paper/60">
                          Relationship Label
                        </label>
                        <input
                          value={rel.label || ""}
                          onChange={(e) =>
                            updateRelationship(
                              rel.id,
                              {
                                label: e.target.value,
                              }
                            )
                          }
                          className="w-full rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                        />
                      </div>
                      {/* Cardinality */}
                      <div className="mb-3">
                        <label className="mb-1 block text-xs text-paper/60">
                          Cardinality
                        </label>
                        <select
                          value={rel.cardinality }
                          onChange={(e) =>
                            updateRelationship(
                              rel.id,
                              {
                                cardinality:
                                  e.target.value,
                              }
                            )
                          }
                          className="w-full rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                        >
                          {CARDINALITIES.map((cardinality) => (
                              <option
                                key={cardinality}
                                value={cardinality}
                              >
                                {cardinality}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                      {/* Description */}
                      <div className="mb-3">
                        <label className="mb-1 block text-xs text-paper/60">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={ rel.description ||""}
                          onChange={(e) =>
                            updateRelationship(
                              rel.id,
                              {
                                description: e.target.value,
                              }
                            )
                          }
                          className="w-full resize-none rounded border border-blueprint-line/30 bg-blueprint-900 px-3 py-2 text-sm text-paper outline-none focus:border-amber"
                        />
                      </div>
                      {/* Junction Table */}

                      <label className="mb-3 flex items-center gap-2 rounded border border-blueprint-line/20 p-2 text-xs">
                        <input
                          type="checkbox"
                          checked={ rel.isJunctionTable }
                          onChange={(e) =>
                            updateRelationship(
                              rel.id,
                              {
                                isJunctionTable: e.target.checked,
                              }
                            )
                          }
                        />
                        Uses Junction Table
                      </label>
                      {/* Delete Relationship */}
                      <button
                        onClick={() => deleteRelationship( rel.id ) }
                        className="flex w-full items-center justify-center gap-2 rounded border border-red-500/40 px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                        Delete Relationship
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {/* ===================================== */}
          {/* DELETE ENTITY */}
          {/* ===================================== */}
          <section className="border-t border-blueprint-line/20 pt-6">
            <button
              onClick={() => {
                if (window.confirm(`Delete "${entity.name}"?` )) {
                  deleteEntity(entity.id);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded border border-red-500/40 bg-red-500/5 px-4 py-3 font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 size={16} />
              Delete Entity
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}