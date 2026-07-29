import { useState } from "react";
import useDiagramStore from "../../store/useDiagramStore";

import PromptInput from "./PromptInput";
import StyleSelector from "./StyleSelector";
import GenerateButton from "./GenerateButton";
import PromptError from "./PromptError";

export default function PromptBar() {
  const {
    diagramView,

    domainAnalysis,

    userFlows,
    selectedFlowRole,
    setSelectedFlowRole,
    addFlowRole,
    deleteFlowRole,
  } = useDiagramStore();

  const entities = domainAnalysis?.entities || [];

  const roles = userFlows.map((flow) => flow.role);

  const [addingRole, setAddingRole] = useState(false);
  const [newRole, setNewRole] = useState("");

  const handleAddRole = (e) => {
    e.preventDefault();

    const role = newRole.trim();

    if (!role) return;

    addFlowRole(role);

    setNewRole("");
    setAddingRole(false);
  };

  return (
    <form className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3">

      {/* ---------------- USER FLOW ---------------- */}

      {diagramView === "userFlow" && (
        <div className="flex flex-col gap-3">

          <div className="flex items-start gap-3">

            <span className="spec-plate mt-1 text-blueprint-line">
              01 / ROLES
            </span>

            <div className="flex flex-1 flex-wrap items-center gap-2">

              {roles.length === 0 ? (
                <span className="text-sm text-paper/40">
                  Generate the architecture first to detect user roles.
                </span>
              ) : (
                roles.map((role) => (
                  <div
                    key={role}
                    className="group flex items-center"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFlowRole(role)}
                      className={`rounded-sm border px-2 py-1 text-xs transition ${
                        role === selectedFlowRole
                          ? "border-amber bg-amber text-blueprint-950"
                          : "border-blueprint-line/30 bg-blueprint-800/70 text-paper hover:border-amber"
                      }`}
                    >
                      {role}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteFlowRole(role)}
                      title={`Remove ${role}`}
                      className="ml-1 hidden text-paper/30 hover:text-node-cache group-hover:inline"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}

              {!addingRole && (
                <button
                  type="button"
                  onClick={() => setAddingRole(true)}
                  className="rounded-sm border border-dashed border-blueprint-line/40 px-2 py-1 text-xs text-paper/60 hover:border-amber hover:text-paper"
                >
                  + Add Role
                </button>
              )}
            </div>
          </div>

          {addingRole && (
            <div className="ml-[88px] rounded-sm border border-blueprint-line/30 bg-blueprint-800/50 p-3">

              <p className="mb-2 text-xs text-paper/60">
                New Role
              </p>

              <div className="flex items-center gap-2">

                <input
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Admin"
                  className="rounded-sm border border-blueprint-line/30 bg-blueprint-800 px-2 py-1 text-sm text-paper focus:border-amber"
                />

                <button
                  type="button"
                  onClick={() => {
                    setAddingRole(false);
                    setNewRole("");
                  }}
                  className="rounded-sm border border-blueprint-line/30 px-3 py-1 text-sm text-paper/70"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAddRole}
                  className="rounded-sm bg-amber px-3 py-1 text-sm font-semibold text-blueprint-950"
                >
                  Add
                </button>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ---------------- ER ---------------- */}

      {diagramView === "er" && (
        <div className="flex items-center gap-3">

          <span className="spec-plate text-blueprint-line">
            01 / ENTITIES
          </span>

          <div className="flex flex-1 flex-wrap gap-2">

            {entities.length === 0 ? (
              <span className="text-sm text-paper/40">
                Generate the architecture first to detect entities.
              </span>
            ) : (
              entities.map((entity) => (
                <span
                  key={entity.name}
                  className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1 text-xs text-paper"
                >
                  {entity.name}
                </span>
              ))
            )}

          </div>

        </div>
      )}

      {/* ---------------- PROMPT ---------------- */}

      <div className="flex items-center gap-3">

        <span className="spec-plate text-blueprint-line">
          {diagramView === "architecture"
            ? "01 / PROMPT"
            : "02 / PROMPT"}
        </span>

        <PromptInput />

        {diagramView === "architecture" && (
          <StyleSelector />
        )}

        <GenerateButton />

      </div>

      <PromptError />

    </form>
  );
}