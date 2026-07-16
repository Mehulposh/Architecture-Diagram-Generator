import useDiagramStore from '../store/useDiagramStore';

const STYLES = ['microservices', 'monolithic', 'event-driven', 'serverless', 'layered'];

export default function PromptBar() {
  const { prompt, setPrompt, architectureStyle, setArchitectureStyle, generateFromPrompt, isGenerating, error } =
    useDiagramStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    generateFromPrompt();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-b border-blueprint-line/30 bg-blueprint-900/80 px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="spec-plate text-blueprint-line">01 / describe</span>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Create architecture for a food delivery app using microservices"
          className="flex-1 rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 font-body text-sm text-paper placeholder:text-paper/40 focus:border-amber"
        />
        <select
          value={architectureStyle}
          onChange={(e) => setArchitectureStyle(e.target.value)}
          className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-2 py-2 font-mono text-xs uppercase text-paper/80"
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="rounded-sm bg-amber px-4 py-2 font-display text-sm font-semibold text-blueprint-950 transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isGenerating ? 'Drafting…' : 'Generate diagram'}
        </button>
      </div>
      {error && <p className="text-xs text-node-cache">{error}</p>}
    </form>
  );
}