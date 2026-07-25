// import { useState } from 'react';
// import useDiagramStore from '../store/useDiagramStore';
// import CollaboratorsPanel from "./CollaboratorsPanel";

// const PALETTE = [
//   { type: 'frontend', label: 'Frontend', color: '#8B7CF6' },
//   { type: 'backend', label: 'Service', color: '#2FB8AC' },
//   { type: 'database', label: 'Database', color: '#F2A93B' },
//   { type: 'cache', label: 'Cache', color: '#F45B69' },
//   { type: 'queue', label: 'Queue', color: '#9B5DE5' },
//   { type: 'api-gateway', label: 'API Gateway', color: '#3A86FF' },
//   { type: 'load-balancer', label: 'Load Balancer', color: '#00B4A6' },
//   { type: 'cloud', label: 'Cloud Storage', color: '#4CC9F0' },
//   { type: 'external', label: 'External API', color: '#8D99AE' },
// ];

// const SEVERITY_COLOR = { high: '#F45B69', medium: '#F2A93B', low: '#4CC9F0', info: '#8D99AE' };
// const COMPLEXITY_COLOR = { simple: '#4CC9F0', moderate: '#F2A93B', complex: '#F45B69' };

// function onDragStart(event, type, color) {
//   event.dataTransfer.setData('application/adg-node-type', type);
//   event.dataTransfer.setData('application/adg-node-color', color);
//   event.dataTransfer.effectAllowed = 'move';
// }

// export default function Sidebar() {
//   const { suggestions, fetchSuggestions, techStack, projectId, owner, collaborators, collaboratorsOnline, ownerId, user, inviteCollaborator, removeCollaborator, domainAnalysis } =
//     useDiagramStore();

//   return (
//     <aside className="flex w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-blueprint-line/30 bg-blueprint-900/60 p-4">
//       {domainAnalysis && <DomainPanel domainAnalysis={domainAnalysis} />}

//       <section>
//         <p className="spec-plate mb-2 text-blueprint-line">02 / components</p>
//         <div className="grid grid-cols-2 gap-2">
//           {PALETTE.map((item) => (
//             <div
//               key={item.type}
//               draggable
//               onDragStart={(e) => onDragStart(e, item.type, item.color)}
//               className="cursor-grab rounded-sm border px-2 py-2 text-center text-xs font-medium text-paper/90 transition-transform active:scale-95"
//               style={{ borderColor: `${item.color}55`, background: `${item.color}15` }}
//             >
//               {item.label}
//             </div>
//           ))}
//         </div>
//       </section>

//       <section>
//         <div className="mb-2 flex items-center justify-between">
//           <p className="spec-plate text-blueprint-line">03 / ai review</p>
//           <button onClick={fetchSuggestions} className="text-xs text-amber hover:underline">
//             Analyze
//           </button>
//         </div>
//         <ul className="flex flex-col gap-2">
//           {suggestions.length === 0 && (
//             <li className="text-xs text-paper/40">Run analysis to surface scalability gaps and missing components.</li>
//           )}
//           {suggestions.map((s, i) => (
//             <li key={i} className="rounded-sm border-l-2 bg-blueprint-800/60 p-2 text-xs leading-snug" style={{ borderColor: SEVERITY_COLOR[s.severity] }}>
//               {s.message}
//             </li>
//           ))}
//         </ul>
//       </section>

//       {projectId && (
//         <CollaboratorsPanel />
//       )}

//       {techStack && (
//         <section>
//           <p className="spec-plate mb-2 text-blueprint-line">04 / tech stack</p>
//           <div className="flex flex-col gap-2 text-xs">
//             {Object.entries(techStack).map(([category, items]) =>
//               items && items.length ? (
//                 <div key={category}>
//                   <p className="font-mono uppercase text-paper/50">{category}</p>
//                   <p className="text-paper/90">{items.join(', ')}</p>
//                 </div>
//               ) : null
//             )}
//           </div>
//         </section>
//       )}
//     </aside>
//   );
// }


// function DomainPanel({ domainAnalysis }) {
//   const { domain, appType, coreFeatures, userRoles, technicalRequirements, complexity } = domainAnalysis;
//   const complexityColor = COMPLEXITY_COLOR[complexity] || '#8D99AE';

//   return (
//     <section>
//       <div className="mb-2 flex items-center justify-between">
//         <p className="spec-plate text-blueprint-line">00 / domain</p>
//         {complexity && (
//           <span
//             className="rounded-sm px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
//             style={{ background: `${complexityColor}22`, color: complexityColor }}
//           >
//             {complexity}
//           </span>
//         )}
//       </div>

//       {domain && <p className="font-display text-sm font-semibold text-paper">{domain}</p>}
//       {appType && <p className="mb-2 text-xs text-paper/50">{appType}</p>}

//       {userRoles?.length > 0 && (
//         <div className="mb-2 flex flex-wrap gap-1.5">
//           {userRoles.map((role, i) => (
//             <span key={i} className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-1.5 py-0.5 text-[10px] text-paper/80">
//               {role}
//             </span>
//           ))}
//         </div>
//       )}

//       {coreFeatures?.length > 0 && (
//         <details className="mb-1">
//           <summary className="cursor-pointer text-xs text-amber hover:underline">Core features ({coreFeatures.length})</summary>
//           <ul className="mt-1.5 flex flex-col gap-1">
//             {coreFeatures.map((f, i) => (
//               <li key={i} className="text-xs leading-snug text-paper/70">
//                 <span className="text-amber">▸</span> {f}
//               </li>
//             ))}
//           </ul>
//         </details>
//       )}

//       {technicalRequirements?.length > 0 && (
//         <details>
//           <summary className="cursor-pointer text-xs text-amber hover:underline">Technical requirements ({technicalRequirements.length})</summary>
//           <ul className="mt-1.5 flex flex-col gap-1">
//             {technicalRequirements.map((t, i) => (
//               <li key={i} className="text-xs leading-snug text-paper/70">
//                 <span className="text-amber">▸</span> {t}
//               </li>
//             ))}
//           </ul>
//         </details>
//       )}
//     </section>
//   );
// }




import useDiagramStore from "../store/useDiagramStore";

import DomainPanel from "./sidebar/DomainPanel";
import ComponentPalette from "./sidebar/ComponentPalette";
import AIReviewPanel from "./sidebar/AIReviewPanel";
import TechStackPanel from "./sidebar/TechStackPanel";
import CollaboratorsPanel from "./CollaboratorsPanel";
import ReadOnlyBanner from "./sidebar/ReadOnlyBanner";

export default function Sidebar() {
  const domainAnalysis = useDiagramStore(
    (state) => state.domainAnalysis
  );

  const techStack = useDiagramStore(
    (state) => state.techStack
  );

  const projectId = useDiagramStore(
    (state) => state.projectId
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-5 overflow-y-auto border-r border-blueprint-line/30 bg-blueprint-900/60 p-4">

      <DomainPanel domainAnalysis={domainAnalysis} />

      <ReadOnlyBanner />

      <ComponentPalette />

      <AIReviewPanel />

      {projectId && <CollaboratorsPanel />}

      <TechStackPanel techStack={techStack} />

    </aside>
  );
}