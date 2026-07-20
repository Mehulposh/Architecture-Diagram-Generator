import useDiagramStore from '../store/useDiagramStore';
import { resolveComponentRefs, findBrokenRefs } from '../utils/resolveRefs';

const ARCHITECTURE_SECTIONS = [
  { key: 'systemOverview', title: 'System Overview' },
  { key: 'componentDescriptions', title: 'Component Descriptions' },
  { key: 'apiFlow', title: 'API Flow' },
  { key: 'databaseDesign', title: 'Database Design' },
  { key: 'deploymentGuidelines', title: 'Deployment Guidelines' },
];

function DocSection({ title, raw, resolutionNodes }) {
  if (!raw) return null;
  const resolved = resolveComponentRefs(raw, resolutionNodes);
  const broken = findBrokenRefs(raw, resolutionNodes);
  const lines = resolved.split('\n').filter(Boolean);
  const isBulletList = lines.length > 1 && lines.every((l) => l.trim().startsWith('- '));

  return (
    <div className="mb-6">
      <p className="spec-plate mb-1.5 text-blueprint-line">{title}</p>
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
          References {broken.length === 1 ? 'a component' : 'components'} that {broken.length === 1 ? 'was' : 'were'} removed from the diagram.
        </p>
      )}
    </div>
  );
}

export default function DocumentationPanel() {
  const { docsOpen, setDocsOpen, documentation, nodes, userFlowOverview, userFlowNodes } = useDiagramStore();

  if (!docsOpen) return null;

  const hasArchitectureDocs = documentation && ARCHITECTURE_SECTIONS.some((s) => documentation[s.key]);
  const hasUserFlowDocs = Boolean(userFlowOverview);
  const hasContent = hasArchitectureDocs || hasUserFlowDocs;

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
            <h2 className="font-display text-lg font-bold text-paper">Generated project docs</h2>
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

          {hasArchitectureDocs && (
            <>
              <p className="mb-3 font-display text-sm font-bold text-paper">Architecture</p>
              {ARCHITECTURE_SECTIONS.map((section) => (
                <DocSection key={section.key} title={section.title} raw={documentation?.[section.key]} resolutionNodes={nodes} />
              ))}
            </>
          )}

          {hasUserFlowDocs && (
            <>
              <p className={`mb-3 font-display text-sm font-bold text-paper ${hasArchitectureDocs ? 'mt-2 border-t border-blueprint-line/20 pt-5' : ''}`}>
                User Flow
              </p>
              <DocSection title="User Flow Overview" raw={userFlowOverview} resolutionNodes={userFlowNodes} />
            </>
          )}

          {hasContent && (
            <p className="mt-2 border-t border-blueprint-line/20 pt-3 text-xs text-paper/30">
              Component and step names above always reflect their current label on the canvas — rename one
              and this text updates automatically, no regeneration needed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}