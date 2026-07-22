import useDiagramStore from '../store/useDiagramStore';

export default function ERBar() {
  const { domainAnalysis, generateERDiagramArtifact, isGeneratingER, erError, erEntities } = useDiagramStore();
  const hasDomain = Boolean(domainAnalysis?.userRoles?.length);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generateERDiagramArtifact();
      }}
      className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3"
    >
      <div className="flex items-center gap-3">
        <span className="spec-plate text-blueprint-line">01 / domain</span>
        <div className="flex-1 text-sm text-paper/70">
          {hasDomain ? (
            <>
              Building entities for <span className="text-paper">{domainAnalysis.domain}</span>
              {domainAnalysis.appType && <span className="text-paper/40"> — {domainAnalysis.appType}</span>}
            </>
          ) : (
            <span className="text-paper/40">Generate the architecture diagram first — the ER schema reuses its domain analysis.</span>
          )}
        </div>
        <button
          type="submit"
          disabled={isGeneratingER || !hasDomain}
          className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isGeneratingER ? 'Designing schema…' : erEntities.length > 0 ? 'Regenerate ER diagram' : 'Generate ER diagram'}
        </button>
      </div>
      {erError && <p className="text-xs text-node-cache">{erError}</p>}
    </form>
  );
}