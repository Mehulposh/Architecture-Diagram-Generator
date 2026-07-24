import useDiagramStore from "../../store/useDiagramStore";
import usePermissions from "../../hooks/usePermissions";

const SEVERITY_COLOR = {
  high: "#F45B69",
  medium: "#F2A93B",
  low: "#4CC9F0",
  info: "#8D99AE",
};

export default function AIReviewPanel() {
  const suggestions = useDiagramStore((s) => s.suggestions);
  const fetchSuggestions = useDiagramStore((s) => s.fetchSuggestions);
  const { canGenerate } = usePermissions();

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="spec-plate text-blueprint-line">
          03 / ai review
        </p>

        <button
          onClick={fetchSuggestions}
          disabled={!canGenerate}
          className="text-xs text-amber hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {suggestions.length === 0 && (
          <li className="text-xs text-paper/40">
            Run analysis to surface scalability gaps and missing components.
          </li>
        )}

        {suggestions.map((s, i) => (
          <li
            key={i}
            className="rounded-sm border-l-2 bg-blueprint-800/60 p-2 text-xs leading-snug"
            style={{
              borderColor: SEVERITY_COLOR[s.severity],
            }}
          >
            {s.message}
          </li>
        ))}
      </ul>
    </section>
  );
}