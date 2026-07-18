import useDiagramStore from '../store/useDiagramStore';
import { resolveIdList } from '../utils/resolveRefs';

export default function NodeDetailsPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, updateNodeData } = useDiagramStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) return null;

  const { data, type } = node;
  const color = data.color || '#94A3B8';
  const communicatesWith = resolveIdList(data.communicatesWith, nodes);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close component details"
        onClick={() => setSelectedNodeId(null)}
        className="flex-1 bg-blueprint-950/60 backdrop-blur-[1px]"
      />
      <div className="flex h-full w-full max-w-md flex-col border-l border-blueprint-line/30 bg-blueprint-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div className="min-w-0">
            <p className="spec-plate mb-1" style={{ color }}>{type}</p>
            <h2 className="truncate font-display text-lg font-bold text-paper">{data.label}</h2>
          </div>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="shrink-0 rounded-sm border border-blueprint-line/40 px-2.5 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {data.purpose && <Field title="Purpose" text={data.purpose} />}
          {data.whyItExists && <Field title="Why this component exists" text={data.whyItExists} />}

          {data.responsibilities?.length > 0 && (
            <ListField title="Responsibilities" items={data.responsibilities} />
          )}
          {data.inputs?.length > 0 && <ListField title="Inputs" items={data.inputs} />}
          {data.outputs?.length > 0 && <ListField title="Outputs" items={data.outputs} />}

          {data.technologies?.length > 0 && (
            <section className="mb-5">
              <p className="spec-plate mb-2 text-blueprint-line">Technologies</p>
              <div className="flex flex-wrap gap-1.5">
                {data.technologies.map((t, i) => (
                  <span key={i} className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-0.5 text-xs text-paper/80">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {communicatesWith.length > 0 && (
            <section className="mb-5">
              <p className="spec-plate mb-2 text-blueprint-line">Communicates with</p>
              <div className="flex flex-wrap gap-1.5">
                {communicatesWith.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedNodeId(c.id)}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-0.5 text-xs text-amber hover:bg-blueprint-800"
                    title="View this component"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.realWorldExamples?.length > 0 && (
            <ListField title="Real-world examples" items={data.realWorldExamples} />
          )}

          <section className="mb-5">
            <p className="spec-plate mb-2 text-blueprint-line">Canvas description</p>
            <textarea
              value={data.description || ''}
              onChange={(e) => updateNodeData(node.id, { description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper/90 focus:border-amber"
            />
            <p className="mt-1 text-[11px] text-paper/30">Shown directly on the diagram node.</p>
          </section>

          {!data.purpose && !data.responsibilities?.length && (
            <p className="text-xs text-paper/40">
              This component doesn't have rich AI-generated documentation yet — that's expected for
              manually dragged-in components, or diagrams generated before this feature existed.
              Regenerate the diagram from a prompt to populate it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ title, text }) {
  return (
    <section className="mb-5">
      <p className="spec-plate mb-1.5 text-blueprint-line">{title}</p>
      <p className="text-sm leading-relaxed text-paper/80">{text}</p>
    </section>
  );
}

function ListField({ title, items }) {
  return (
    <section className="mb-5">
      <p className="spec-plate mb-1.5 text-blueprint-line">{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed text-paper/80">
            <span className="text-amber">▸</span> {item}
          </li>
        ))}
      </ul>
    </section>
  );
}