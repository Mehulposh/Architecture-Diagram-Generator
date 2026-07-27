import useDiagramStore from "../../store/useDiagramStore";

import PromptInput from "./PromptInput";
import StyleSelector from "./StyleSelector";
import GenerateButton from "./GenerateButton";
import PromptError from "./PromptError";

export default function PromptBar() {
  const {
    diagramView,
    domainAnalysis,
    selectedFlowRole,
    setSelectedFlowRole,
  } = useDiagramStore();

  const roles = domainAnalysis?.userRoles || [];
  const entities = domainAnalysis?.entities || [];

  return (
    <form className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3">
      {/* User Flow Context */}
      {diagramView === "userFlow" && (
        <div className="flex items-center gap-3">
          <span className="spec-plate text-blueprint-line">
            01 / ROLES
          </span>

          <div className="flex flex-1 flex-wrap gap-2">
            {roles.length === 0 ? (
              <span className="text-sm text-paper/40">
                Generate the architecture first to detect user roles.
              </span>
            ) : (
              roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedFlowRole(role)}
                  className={`rounded-sm border px-2 py-1 text-xs transition
                    ${
                      role === selectedFlowRole
                        ? "border-amber bg-amber text-blueprint-950"
                        : "border-blueprint-line/30 bg-blueprint-800/70 text-paper hover:border-amber"
                    }`}
                >
                  {role}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ER Context */}
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

      {/* Prompt */}
      <div className="flex items-center gap-3">
        <span className="spec-plate text-blueprint-line">
          {diagramView === "architecture"
            ? "01 / PROMPT"
            : diagramView === "userFlow"
            ? "02 / PROMPT"
            : "02 / PROMPT"}
        </span>

        <PromptInput />

        {diagramView === "architecture" && <StyleSelector />}

        <GenerateButton />
      </div>

      <PromptError />
    </form>
  );
}