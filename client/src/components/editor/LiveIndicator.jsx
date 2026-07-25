import useDiagramStore from "../../store/useDiagramStore";

export default function LiveIndicator() {
  const projectId = useDiagramStore((s) => s.projectId);

  const othersOnline = useDiagramStore(
    (s) => s.collaboratorsOnline.length
  );

  const count = projectId
    ? othersOnline + 1
    : 0;

  if (!count) return <span />;

  return (
    <span className="flex items-center gap-1.5 text-amber">
      <span className="h-1.5 w-1.5 rounded-full bg-amber" />

      {count}{" "}
      {count === 1
        ? "collaborator"
        : "collaborators"}{" "}
      online
    </span>
  );
}