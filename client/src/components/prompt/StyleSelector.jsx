import useDiagramStore from "../../store/useDiagramStore";
import usePermissions from "../../hooks/usePermissions";

const STYLES = [
  "microservices",
  "monolithic",
  "event-driven",
  "serverless",
  "layered",
];

export default function StyleSelector() {
  const architectureStyle = useDiagramStore(
    (s) => s.architectureStyle
  );

  const setArchitectureStyle = useDiagramStore(
    (s) => s.setArchitectureStyle
  );

  const { canGenerate } = usePermissions();

  return (
    <select
      value={architectureStyle}
      onChange={(e) => setArchitectureStyle(e.target.value)}
      disabled={!canGenerate}
      className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-2 font-mono text-xs uppercase text-paper/80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {STYLES.map((style) => (
        <option key={style} value={style}>
          {style}
        </option>
      ))}
    </select>
  );
}