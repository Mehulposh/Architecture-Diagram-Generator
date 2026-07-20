import useDiagramStore from '../store/useDiagramStore';

export default function UserFlowBar() {
  const { domainAnalysis, generateUserFlowArtifact, isGeneratingUserFlow, userFlowError, userFlowNodes } = useDiagramStore();
  const roles = domainAnalysis?.userRoles || [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generateUserFlowArtifact();
      }}
      className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3"
    >
      <div className="flex items-center gap-3">
        <span className="spec-plate text-blueprint-line">01 / roles</span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {roles.length === 0 && (
            <span className="text-sm text-paper/40">Generate the architecture diagram first — user flow reuses its domain roles.</span>
          )}
          {roles.map((role, i) => (
            <span key={i} className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-0.5 text-xs text-paper/80">
              {role}
            </span>
          ))}
        </div>
        <button
          type="submit"
          disabled={isGeneratingUserFlow || roles.length === 0}
          className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isGeneratingUserFlow ? 'Mapping flow…' : userFlowNodes.length > 0 ? 'Regenerate user flow' : 'Generate user flow'}
        </button>
      </div>
      {userFlowError && <p className="text-xs text-node-cache">{userFlowError}</p>}
    </form>
  );
}