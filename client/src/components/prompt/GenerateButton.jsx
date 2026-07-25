import useDiagramStore from "../../store/useDiagramStore";
import usePermissions from "../../hooks/usePermissions";

export default function GenerateButton() {
  const prompt = useDiagramStore((s) => s.prompt);
  const isGenerating = useDiagramStore((s) => s.isGenerating);
  const generateFromPrompt = useDiagramStore(
    (s) => s.generateFromPrompt
  );

  const { canGenerate, permission } = usePermissions();

  return (
    <div className="flex flex-col items-end">
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          generateFromPrompt();
        }}
        disabled={
          isGenerating ||
          !prompt.trim() ||
          !canGenerate
        }
        className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isGenerating
          ? "Drafting..."
          : "Generate Diagram"}
      </button>

      {!canGenerate && (
        <p className="mt-1 text-[10px] text-paper/50">
          {permission === "viewer"
            ? "Viewer permission cannot generate diagrams."
            : "Generation unavailable."}
        </p>
      )}
    </div>
  );
}