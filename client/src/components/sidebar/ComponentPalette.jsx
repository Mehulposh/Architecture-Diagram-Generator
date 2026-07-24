import usePermissions from "../../hooks/usePermissions";

const PALETTE = [
  { type: "frontend", label: "Frontend", color: "#8B7CF6" },
  { type: "backend", label: "Service", color: "#2FB8AC" },
  { type: "database", label: "Database", color: "#F2A93B" },
  { type: "cache", label: "Cache", color: "#F45B69" },
  { type: "queue", label: "Queue", color: "#9B5DE5" },
  { type: "api-gateway", label: "API Gateway", color: "#3A86FF" },
  { type: "load-balancer", label: "Load Balancer", color: "#00B4A6" },
  { type: "cloud", label: "Cloud Storage", color: "#4CC9F0" },
  { type: "external", label: "External API", color: "#8D99AE" },
];

function onDragStart(event, type, color) {
  event.dataTransfer.setData("application/adg-node-type", type);
  event.dataTransfer.setData("application/adg-node-color", color);
  event.dataTransfer.effectAllowed = "move";
}

export default function ComponentPalette() {
  const { canEdit } = usePermissions();

  return (
    <section>
      <p className="spec-plate mb-2 text-blueprint-line">
        02 / components
      </p>

      {!canEdit ? (
        <div className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/60 p-3 text-xs text-paper/50">
          Architecture is read-only.
          <br />
          Drag & Drop is disabled.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {PALETTE.map((item) => (
            <div
              key={item.type}
              draggable
              onDragStart={(e) =>
                onDragStart(e, item.type, item.color)
              }
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