function LaneNode({ data }) {
  return (
    <div
      className="pointer-events-none flex h-full items-start rounded-sm border-t border-dashed"
      style={{ background: `${data.color}0d`, borderColor: `${data.color}40` }}
    >
      <span
        className="sticky left-2 top-2 rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
        style={{ background: `${data.color}22`, color: data.color }}
      >
        {data.role}
      </span>
    </div>
  );
}

export default LaneNode;