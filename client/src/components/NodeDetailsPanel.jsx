import { useEffect, useState } from 'react';
import useDiagramStore from '../store/useDiagramStore';
import { resolveIdList } from '../utils/resolveRefs';

export default function NodeDetailsPanel() {
  const {
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData,
    deleteNode,
  } = useDiagramStore();

  const node = nodes.find((n) => n.id === selectedNodeId);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!node) return;

    setLabel(node.data?.label || '');
    setDescription(node.data?.description || '');
  }, [
    node?.id,
    node?.data?.label,
    node?.data?.description,
  ]);

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

        {/* Header */}

        <div className="flex items-start justify-between border-b border-blueprint-line/30 px-5 py-4">
          <div className="min-w-0">
            <p
              className="spec-plate mb-1"
              style={{ color }}
            >
              {type}
            </p>

            <h2 className="truncate font-display text-lg font-bold text-paper">
              {label}
            </h2>
          </div>

          <button
            onClick={() => setSelectedNodeId(null)}
            className="shrink-0 rounded-sm border border-blueprint-line/40 px-2.5 py-1 text-sm text-paper/70 hover:bg-blueprint-800"
          >
            Close
          </button>
        </div>

        {/* Body */}

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Component Name */}

          <section className="mb-5">
            <p className="spec-plate mb-2 text-blueprint-line">
              Component Name
            </p>

            <input
              value={label}
              onChange={(e) => {
                const value = e.target.value;

                setLabel(value);

                updateNodeData(node.id, {
                  label: value,
                });
              }}
              className="w-full rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper focus:border-amber"
            />
          </section>

          {/* Purpose */}

          {data.purpose && (
            <Field
              title="Purpose"
              text={data.purpose}
            />
          )}

          {/* Why */}

          {data.whyItExists && (
            <Field
              title="Why this component exists"
              text={data.whyItExists}
            />
          )}

          {/* Responsibilities */}

          {data.responsibilities?.length > 0 && (
            <ListField
              title="Responsibilities"
              items={data.responsibilities}
            />
          )}

          {/* Inputs */}

          {data.inputs?.length > 0 && (
            <ListField
              title="Inputs"
              items={data.inputs}
            />
          )}

          {/* Outputs */}

          {data.outputs?.length > 0 && (
            <ListField
              title="Outputs"
              items={data.outputs}
            />
          )}

          {/* Technologies */}

          {data.technologies?.length > 0 && (
            <section className="mb-5">
              <p className="spec-plate mb-2 text-blueprint-line">
                Technologies
              </p>

              <div className="flex flex-wrap gap-1.5">
                {data.technologies.map((tech, index) => (
                  <span
                    key={index}
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-0.5 text-xs text-paper/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Communicates With */}

          {communicatesWith.length > 0 && (
            <section className="mb-5">
              <p className="spec-plate mb-2 text-blueprint-line">
                Communicates With
              </p>

              <div className="flex flex-wrap gap-1.5">
                {communicatesWith.map((component) => (
                  <button
                    key={component.id}
                    onClick={() =>
                      setSelectedNodeId(component.id)
                    }
                    className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-0.5 text-xs text-amber hover:bg-blueprint-800"
                    title="View component"
                  >
                    {component.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Real World Examples */}

          {data.realWorldExamples?.length > 0 && (
            <ListField
              title="Real-world examples"
              items={data.realWorldExamples}
            />
          )}

          {/* Canvas Description */}

          <section className="mb-5">
            <p className="spec-plate mb-2 text-blueprint-line">
              Canvas Description
            </p>

            <textarea
              value={description}
              onChange={(e) => {
                const value = e.target.value;

                setDescription(value);

                updateNodeData(node.id, {
                  description: value,
                });
              }}
              rows={3}
              className="w-full resize-none rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-1.5 text-sm text-paper/90 focus:border-amber"
            />

            <p className="mt-1 text-[11px] text-paper/30">
              This description appears directly on the architecture diagram.
            </p>
          </section>

          {/* Empty State */}

          {!data.purpose && !data.responsibilities?.length && (
            <p className="mb-5 text-xs text-paper/40">
              This component doesn't have rich AI-generated documentation yet.
              That's expected for manually added components or diagrams
              generated before this feature existed.
            </p>
          )}

          {/* Delete */}

          <button
            onClick={() => {
              deleteNode(node.id);
              setSelectedNodeId(null);
            }}
            className="rounded-sm border border-node-cache/40 px-3 py-1.5 text-sm text-node-cache hover:bg-node-cache/10"
          >
            Delete Component
          </button>

        </div>
      </div>
    </div>
  );
}

function Field({ title, text }) {
  return (
    <section className="mb-5">
      <p className="spec-plate mb-1.5 text-blueprint-line">
        {title}
      </p>

      <p className="text-sm leading-relaxed text-paper/80">
        {text}
      </p>
    </section>
  );
}

function ListField({ title, items }) {
  return (
    <section className="mb-5">
      <p className="spec-plate mb-1.5 text-blueprint-line">
        {title}
      </p>

      <ul className="flex flex-col gap-1">
        {items.map((item, index) => (
          <li
            key={index}
            className="text-sm leading-relaxed text-paper/80"
          >
            <span className="text-amber">▸</span> {item}
          </li>
        ))}
      </ul>
    </section>
  );
}