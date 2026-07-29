import useDiagramStore from "../../store/useDiagramStore";

import ComponentPalette from "./ComponentPalette";
import StepPalette from "./StepPalette";

export default function PalettePanel() {
  const { diagramView } = useDiagramStore();

  switch (diagramView) {
    case "architecture":
      return <ComponentPalette />;

    case "userFlow":
      return <StepPalette />;

    case "er":
      return (
        <section>
          <p className="spec-plate mb-2 text-blueprint-line">
            02 / entities
          </p>

          <div className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/60 p-3 text-xs text-paper/50">
            Entity editing palette coming soon.
          </div>
        </section>
      );

    default:
      return null;
  }
}