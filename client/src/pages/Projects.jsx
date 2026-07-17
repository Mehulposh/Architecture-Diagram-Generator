import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDiagramStore from '../store/useDiagramStore';

export default function Projects() {
  const { projects, fetchProjects, loadProject, resetProject } = useDiagramStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects()
      .catch(() => setError('Could not load your projects.'))
      .finally(() => setLoading(false));
  }, []);

  const open = async (id) => {
    try {
      await loadProject(id);
      navigate('/editor');
    } catch {
      setError('Could not open that project.');
    }
  };

  const startNew = () => {
    resetProject();
    navigate('/editor');
  };

  return (
    <div className="blueprint-canvas min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="spec-plate text-blueprint-line">Projects</p>
          <h1 className="font-display text-2xl font-bold text-paper">Your architectures</h1>
        </div>
        <button
          onClick={startNew}
          className="rounded-sm bg-amber px-3 py-1.5 font-display text-sm font-semibold text-blueprint-950 hover:opacity-90"
        >
          + New architecture
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-node-cache">{error}</p>}
      {loading && <p className="text-sm text-paper/50">Loading…</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <button
            key={p._id}
            onClick={() => open(p._id)}
            className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-4 text-left transition-colors hover:border-amber/60"
          >
            <p className="truncate font-display text-sm font-semibold text-paper">{p.name}</p>
            <p className="spec-plate mt-1 text-blueprint-line">{p.architectureStyle}</p>
            <p className="mt-2 text-xs text-paper/40">Updated {new Date(p.updatedAt).toLocaleDateString()}</p>
          </button>
        ))}
        {projects.length === 0 && !loading && (
          <p className="text-sm text-paper/40">
            No saved projects yet — describe an app in the editor and hit Save.
          </p>
        )}
      </div>
    </div>
  );
}