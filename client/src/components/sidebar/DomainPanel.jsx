const COMPLEXITY_COLOR = {
  simple: "#4CC9F0",
  moderate: "#F2A93B",
  complex: "#F45B69",
};

export default function DomainPanel({ domainAnalysis }) {
  if (!domainAnalysis) return null;

  const {
    domain,
    appType,
    coreFeatures,
    userRoles,
    technicalRequirements,
    complexity,
  } = domainAnalysis;

  const complexityColor =
    COMPLEXITY_COLOR[complexity] || "#8D99AE";

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="spec-plate text-blueprint-line">
          00 / domain
        </p>

        {complexity && (
          <span
            className="rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
            style={{
              background: `${complexityColor}22`,
              color: complexityColor,
            }}
          >
            {complexity}
          </span>
        )}
      </div>

      {domain && (
        <p className="font-display text-sm font-semibold text-paper">
          {domain}
        </p>
      )}

      {appType && (
        <p className="mb-2 text-xs text-paper/50">
          {appType}
        </p>
      )}

      {userRoles?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {userRoles.map((role, i) => (
            <span
              key={i}
              className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-1.5 py-0.5 text-[10px] text-paper/80"
            >
              {role}
            </span>
          ))}
        </div>
      )}

      {coreFeatures?.length > 0 && (
        <details className="mb-1">
          <summary className="cursor-pointer text-xs text-amber hover:underline">
            Core features ({coreFeatures.length})
          </summary>

          <ul className="mt-1.5 flex flex-col gap-1">
            {coreFeatures.map((feature, i) => (
              <li
                key={i}
                className="text-xs leading-snug text-paper/70"
              >
                <span className="text-amber">▸</span> {feature}
              </li>
            ))}
          </ul>
        </details>
      )}

      {technicalRequirements?.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-amber hover:underline">
            Technical requirements ({technicalRequirements.length})
          </summary>

          <ul className="mt-1.5 flex flex-col gap-1">
            {technicalRequirements.map((item, i) => (
              <li
                key={i}
                className="text-xs leading-snug text-paper/70"
              >
                <span className="text-amber">▸</span> {item}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}