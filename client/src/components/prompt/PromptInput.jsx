import useDiagramStore from "../../store/useDiagramStore";
import usePermissions from "../../hooks/usePermissions";

export default function PromptInput() {
  const prompt = useDiagramStore((s) => s.prompt);
  const setPrompt = useDiagramStore((s) => s.setPrompt);

  const { canGenerate } = usePermissions();

  return (
    <input
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      disabled={!canGenerate}
      placeholder="e.g. Create architecture for a food delivery app using microservices"
      className="flex-1 rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 font-body text-sm text-paper placeholder:text-paper/40 focus:border-amber disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}