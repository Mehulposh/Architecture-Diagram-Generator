import useDiagramStore from "../../store/useDiagramStore";

export default function ReadOnlyBanner() {
  const permission = useDiagramStore((s) => s.permission);

  if (permission !== "viewer") return null;

  return (
    <section className="rounded-sm border border-amber/30 bg-amber/10 p-3">
      <div className="mb-1 font-display text-sm font-semibold text-amber">
        👀 Read-only Mode
      </div>

      <p className="text-xs leading-relaxed text-paper/70">
        You have Viewer access to this architecture.
        <br />
        Contact the project owner if you need editing permissions.
      </p>
    </section>
  );
}