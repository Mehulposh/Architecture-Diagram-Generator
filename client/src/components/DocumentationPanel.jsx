import useDiagramStore from '../store/useDiagramStore';
import { resolveComponentRefs, findBrokenRefs } from '../utils/resolveRefs';

const SECTIONS = [
  { key: 'systemOverview', title: 'System Overview' },
  { key: 'componentDescriptions', title: 'Component Descriptions' },
  { key: 'apiFlow', title: 'API Flow' },
  { key: 'databaseDesign', title: 'Database Design' },
  { key: 'deploymentGuidelines', title: 'Deployment Guidelines' },
];

export default function DocumentationPanel() {
  const { docsOpen, setDocsOpen, documentation, nodes } = useDiagramStore();

  if (!docsOpen) return null;

  const hasContent = documentation && SECTIONS.some((s) => documentation[s.key]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close documentation"
        onClick={() => setDocsOpen(false)}
        className="flex-1 bg-blueprint-950/60 backdrop-blur-[1px]"
      />
      <div className="flex h-full w-full max-w-xl flex-col border-l border-blueprint-line/30 bg-blueprint-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div>
            <p className="spec-plate text-blueprint-line">Documentation</p>
            <h2 className="font-display text-lg font-bold text-paper">Generated architecture docs</h2>
          </div>
          <button
            onClick={() => setDocsOpen(false)}
            className="rounded-sm border border-blueprint-line/40 px-2.5 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hasContent && (
            <p className="text-sm text-paper/50">
              No documentation yet — generate a diagram from a prompt to produce it.
            </p>
          )}

          {hasContent &&
            SECTIONS.map((section) => {
              const raw = documentation?.[section.key];
              if (!raw) return null;
              const resolved = resolveComponentRefs(raw, nodes);
              const broken = findBrokenRefs(raw, nodes);
              const lines = resolved.split('\n').filter(Boolean);
              const isBulletList = lines.length > 1 && lines.every((l) => l.trim().startsWith('- '));

              return (
                <div key={section.key} className="mb-6">
                  <p className="spec-plate mb-1.5 text-blueprint-line">{section.title}</p>
                  {isBulletList ? (
                    <ul className="flex flex-col gap-1.5">
                      {lines.map((line, i) => (
                        <li key={i} className="text-sm leading-relaxed text-paper/80">
                          <span className="text-amber">▸</span> {line.replace(/^-\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm leading-relaxed text-paper/80">{resolved}</p>
                  )}
                  {broken.length > 0 && (
                    <p className="mt-1.5 text-xs text-node-cache">
                      References {broken.length === 1 ? 'a component' : 'components'} that {broken.length === 1 ? "was" : "were"} deleted from the diagram.
                    </p>
                  )}
                </div>
              );
            })}

          {hasContent && (
            <p className="mt-2 border-t border-blueprint-line/20 pt-3 text-xs text-paper/30">
              Component names above always reflect their current label on the canvas — rename a
              component and this text updates automatically, no regeneration needed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}