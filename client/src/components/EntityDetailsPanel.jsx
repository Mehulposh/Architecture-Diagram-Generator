import useDiagramStore from '../store/useDiagramStore';
import { resolveComponentRefs } from '../utils/resolveRefs';

export default function EntityDetailsPanel() {
  const { erEntities, erRelationships, selectedEntityId, setSelectedEntityId } = useDiagramStore();
  const entity = erEntities.find((e) => e.id === selectedEntityId);

  if (!entity) return null;

  const related = erRelationships.filter((r) => r.source === entity.id || r.target === entity.id);
  const entityById = Object.fromEntries(erEntities.map((e) => [e.id, e]));

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close entity details"
        onClick={() => setSelectedEntityId(null)}
        className="flex-1 bg-blueprint-950/60 backdrop-blur-[1px]"
      />
      <div className="flex h-full w-full max-w-md flex-col border-l border-blueprint-line/30 bg-blueprint-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div className="min-w-0">
            <p className="spec-plate mb-1 text-amber">entity</p>
            <h2 className="truncate font-display text-lg font-bold text-paper">{entity.name}</h2>
          </div>
          <button
            onClick={() => setSelectedEntityId(null)}
            className="shrink-0 rounded-sm border border-blueprint-line/40 px-2.5 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {entity.purpose && (
            <section className="mb-5">
              <p className="spec-plate mb-1.5 text-blueprint-line">Purpose</p>
              <p className="text-sm leading-relaxed text-paper/80">{resolveComponentRefs(entity.purpose, erEntities.map((e) => ({ id: e.id, data: { label: e.name } })))}</p>
            </section>
          )}

          <section className="mb-5">
            <p className="spec-plate mb-2 text-blueprint-line">Attributes ({entity.attributes?.length || 0})</p>
            <div className="overflow-hidden rounded-sm border border-blueprint-line/30">
              {(entity.attributes || []).map((attr, i) => (
                <div
                  key={i}
                  className={`px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-blueprint-800/40' : ''} ${i > 0 ? 'border-t border-blueprint-line/10' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-paper/90">
                      {attr.isPrimaryKey && <span className="rounded-sm bg-amber/25 px-1 text-[9px] font-bold text-amber">PK</span>}
                      {attr.isForeignKey && <span className="rounded-sm bg-node-gateway/25 px-1 text-[9px] font-bold text-node-gateway">FK</span>}
                      {attr.unique && !attr.isPrimaryKey && <span className="rounded-sm bg-node-cache/20 px-1 text-[9px] font-bold text-node-cache">UNIQUE</span>}
                      {attr.name}
                    </span>
                    <span className="shrink-0 text-paper/40">{attr.type}</span>
                  </div>
                  {attr.description && <p className="mt-0.5 text-paper/50">{attr.description}</p>}
                  {attr.isForeignKey && attr.foreignKeyRef && entityById[attr.foreignKeyRef] && (
                    <button
                      onClick={() => setSelectedEntityId(attr.foreignKeyRef)}
                      className="mt-1 text-[11px] text-amber hover:underline"
                    >
                      → references {entityById[attr.foreignKeyRef].name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {related.length > 0 && (
            <section className="mb-5">
              <p className="spec-plate mb-2 text-blueprint-line">Relationships</p>
              <ul className="flex flex-col gap-2">
                {related.map((rel) => {
                  const otherId = rel.source === entity.id ? rel.target : rel.source;
                  const other = entityById[otherId];
                  return (
                    <li key={rel.id} className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/50 p-2 text-xs">
                      <button onClick={() => other && setSelectedEntityId(otherId)} className="font-semibold text-amber hover:underline">
                        {other?.name || 'Unknown entity'}
                      </button>
                      <span className="ml-1.5 rounded-sm bg-blueprint-700 px-1.5 py-0.5 font-mono text-[10px] text-paper/70">
                        {rel.cardinality}
                      </span>
                      {rel.label && <span className="ml-1.5 text-paper/60">{rel.label}</span>}
                      {rel.description && <p className="mt-1 text-paper/50">{rel.description}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}