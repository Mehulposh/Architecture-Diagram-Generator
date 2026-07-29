import usePermissions from "../../hooks/usePermissions";

const STEP_PALETTE = [
  {
    type: "start",
    label: "Start",
    color: "#4CC9F0",
  },
  {
    type: "action",
    label: "Action",
    color: "#8B7CF6",
  },
  {
    type: "decision",
    label: "Decision",
    color: "#F2A93B",
  },
  {
    type: "handoff",
    label: "Handoff",
    color: "#9B5DE5",
  },
  {
    type: "end",
    label: "End",
    color: "#2FB8AC",
  },
];

function onDragStart(event, type) {
  event.dataTransfer.setData(
    "application/adg-step-type",
    type
  );

  event.dataTransfer.effectAllowed = "move";
}

export default function StepPalette() {
  const { canEdit } = usePermissions();

  return (
    <section>
      <p className="spec-plate mb-2 text-blueprint-line">
        02 / STEP TYPES
      </p>

      {!canEdit ? (
        <div className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/60 p-3 text-xs text-paper/50">
          User Flow is read-only.
          <br />
          Drag &amp; Drop is disabled.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {STEP_PALETTE.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) =>
                onDragStart(e, item.type)
              }
              title={`Drag onto the canvas to add a ${item.label} step`}
              className="cursor-grab rounded-sm border px-2 py-2 text-center text-xs font-medium text-paper/90 transition-transform active:scale-95"
              style={{
                borderColor: `${item.color}55`,
                background: `${item.color}15`,
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}