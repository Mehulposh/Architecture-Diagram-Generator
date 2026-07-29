import { useEffect, useState } from "react";
import useDiagramStore from "../store/useDiagramStore";

const STEP_TYPES = [
  "start",
  "action",
  "decision",
  "end",
  "handoff",
];

export default function FlowStepDetailsPanel() {
  const {
    userFlows,
    selectedFlowRole,
    selectedFlowStepId,
    setSelectedFlowStepId,
    updateFlowStepData,
    deleteFlowStep,
  } = useDiagramStore();

  const flow = userFlows.find(
    (f) => f.role === selectedFlowRole
  );

  const step = flow?.nodes.find(
    (n) => n.id === selectedFlowStepId
  );

  const stepData = step?.data;

  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [handoffRole, setHandoffRole] = useState("");

  useEffect(() => {
    if (!step) return;

    setLabel(stepData?.label || "");
    setDescription(stepData?.description || "");
    setHandoffRole(stepData?.handoffRole || "");
  }, [
    step?.id,
    stepData?.label,
    stepData?.description,
    stepData?.handoffRole,
  ]);

  if (!step) return null;

  const otherRoles = userFlows
    .map((f) => f.role)
    .filter((r) => r !== selectedFlowRole);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close"
        onClick={() => setSelectedFlowStepId(null)}
        className="flex-1 bg-blueprint-950/60 backdrop-blur-[1px]"
      />

      <div className="flex h-full w-full max-w-md flex-col border-l border-blueprint-line/30 bg-blueprint-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div className="min-w-0">
            <p className="spec-plate mb-1 text-amber">
              {selectedFlowRole}
            </p>

            <h2 className="truncate font-display text-lg font-bold text-paper">
              {label}
            </h2>
          </div>

          <button
            onClick={() => setSelectedFlowStepId(null)}
            className="shrink-0 rounded-sm border border-blueprint-line/40 px-2.5 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">

          <section className="mb-5">
            <p className="spec-plate mb-1.5 text-blueprint-line">
              Step Name
            </p>

            <input
              value={label}
              onChange={(e) => {
                const value = e.target.value;
                setLabel(value);

                updateFlowStepData(step.id, {
                  label: value,
                });
              }}
              className="w-full rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper focus:border-amber"
            />
          </section>

          <section className="mb-5">
            <p className="spec-plate mb-1.5 text-blueprint-line">
              Step Type
            </p>

            <div className="flex flex-wrap gap-1.5">
              {STEP_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    updateFlowStepData(step.id, {
                      stepType: t,
                    })
                  }
                  className={`rounded-sm border px-2 py-1 text-xs capitalize ${
                    stepData?.stepType === t
                      ? "border-amber bg-amber/20 text-amber"
                      : "border-blueprint-line/30 text-paper/70 hover:bg-blueprint-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {stepData?.stepType === "handoff" && (
            <section className="mb-5">
              <p className="spec-plate mb-1.5 text-blueprint-line">
                Hands off to role
              </p>

              <input
                value={handoffRole}
                onChange={(e) =>
                  setHandoffRole(e.target.value)
                }
                onBlur={() =>
                  updateFlowStepData(step.id, {
                    handoffRole,
                  })
                }
                list="other-roles"
                className="w-full rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper focus:border-amber"
              />

              <datalist id="other-roles">
                {otherRoles.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </section>
          )}

          <section className="mb-5">
            <p className="spec-plate mb-1.5 text-blueprint-line">
              Description
            </p>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              onBlur={() =>
                updateFlowStepData(step.id, {
                  description,
                })
              }
              rows={4}
              className="w-full resize-none rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper/90 focus:border-amber"
            />
          </section>

          <button
            onClick={() => deleteFlowStep(step.id)}
            className="rounded-sm border border-node-cache/40 px-3 py-1.5 text-sm text-node-cache hover:bg-node-cache/10"
          >
            Delete Step
          </button>
        </div>
      </div>
    </div>
  );
}