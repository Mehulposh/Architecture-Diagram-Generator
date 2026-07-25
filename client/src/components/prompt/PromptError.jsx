import useDiagramStore from "../../store/useDiagramStore";

export default function PromptError() {
  const error = useDiagramStore((s) => s.error);

  if (!error) return null;

  return (
    <p className="text-xs text-node-cache">
      {error}
    </p>
  );
}