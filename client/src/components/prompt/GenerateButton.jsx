import useDiagramStore from "../../store/useDiagramStore";
import usePermissions from "../../hooks/usePermissions";

export default function GenerateButton() {
  const prompt = useDiagramStore((s) => s.prompt);

  const diagramView = useDiagramStore(
    (s) => s.diagramView
  );

  const domainAnalysis = useDiagramStore(
    (s) => s.domainAnalysis
  );

  const userFlows = useDiagramStore(
    (s) => s.userFlows
  );

  const erEntities = useDiagramStore(
    (s) => s.erEntities
  );

  const generateArchitecture = useDiagramStore(
    (s) => s.generateFromPrompt
  );

  const generateUserFlow = useDiagramStore(
    (s) => s.generateUserFlowArtifact
  );

  const generateERDiagram = useDiagramStore(
    (s) => s.generateERDiagramArtifact
  );

  const isGenerating = useDiagramStore(
    (s) => s.isGenerating
  );

  const isGeneratingUserFlow = useDiagramStore(
    (s) => s.isGeneratingUserFlow
  );

  const isGeneratingER = useDiagramStore(
    (s) => s.isGeneratingER
  );

  const { canGenerate, permission } = usePermissions();

  let buttonText = "";
  let loading = false;
  let onGenerate = () => {};

  switch (diagramView) {
    case "architecture":
      buttonText = "Generate Architecture";
      loading = isGenerating;
      onGenerate = generateArchitecture;
      break;

    case "userFlow":
      buttonText =
        userFlows.length > 0
          ? "Regenerate User Flow"
          : "Generate User Flow";

      loading = isGeneratingUserFlow;
      onGenerate = generateUserFlow;
      break;

    case "er":
      buttonText =
        erEntities.length > 0
          ? "Regenerate ER Diagram"
          : "Generate ER Diagram";

      loading = isGeneratingER;
      onGenerate = generateERDiagram;
      break;

    default:
      buttonText = "Generate";
  }

  const disabled =
    loading ||
    !prompt.trim() ||
    !canGenerate ||
    (
      diagramView !== "architecture" &&
      !domainAnalysis
    );

  return (
    <div className="flex flex-col items-end">
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        disabled={disabled}
        className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Generating..." : buttonText}
      </button>

      {!canGenerate && (
        <p className="mt-1 text-[10px] text-paper/50">
          {permission === "viewer"
            ? "Viewer permission cannot generate diagrams."
            : "Generation unavailable."}
        </p>
      )}

      {diagramView !== "architecture" &&
        !domainAnalysis && (
          <p className="mt-1 text-[10px] text-amber">
            Generate the architecture first.
          </p>
        )}
    </div>
  );
}