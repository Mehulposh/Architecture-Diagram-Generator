export default function TechStackPanel({ techStack }) {
  if (!techStack) return null;

  return (
    <section>
      <p className="spec-plate mb-2 text-blueprint-line">
        04 / tech stack
      </p>

      <div className="flex flex-col gap-2 text-xs">
        {Object.entries(techStack).map(([category, items]) =>
          items?.length ? (
            <div key={category}>
              <p className="font-mono uppercase text-paper/50">
                {category}
              </p>

              <p className="text-paper/90">
                {items.join(", ")}
              </p>
            </div>
          ) : null
        )}
      </div>
    </section>
  );
}