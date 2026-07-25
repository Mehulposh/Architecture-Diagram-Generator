import useDiagramStore from "../../store/useDiagramStore";

const MESSAGES = {
  architecture: {
    icon: "🏗",
    title: "No Architecture Yet",
    description:
      "Describe your application above or drag a component from the left.",
  },

  userFlow: {
    icon: "👥",
    title: "No User Flow Yet",
    description:
      "Generate a user flow for this application.",
  },

  er: {
    icon: "🗄",
    title: "No ER Diagram Yet",
    description:
      "Generate your database schema automatically.",
  },
};

export default function EmptyState() {
  const diagramView = useDiagramStore(
    (s) => s.diagramView
  );

  const message = MESSAGES[diagramView];

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

      <div className="rounded border border-dashed border-blueprint-line/40 bg-blueprint-900/60 px-8 py-6 text-center">

        <div className="mb-3 text-4xl">
          {message.icon}
        </div>

        <div className="font-display text-lg text-paper">
          {message.title}
        </div>

        <div className="mt-2 text-sm text-paper/50">
          {message.description}
        </div>

      </div>

    </div>
  );
}