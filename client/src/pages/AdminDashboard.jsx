import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDiagramStore from '../store/useDiagramStore';

export default function AdminDashboard() {
  const { adminStats, adminUsers, adminProjects, fetchAdminOverview, deleteAdminUser, deleteAdminProject, user, logout } =
    useDiagramStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminOverview()
      .catch(() => setError('Could not load admin data. Make sure this account has admin access.'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user and all of their projects? This cannot be undone.')) return;
    try {
      await deleteAdminUser(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete user.');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteAdminProject(id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete project.');
    }
  };

  return (
    <div className="blueprint-canvas min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="spec-plate text-blueprint-line">Admin</p>
          <h1 className="font-display text-2xl font-bold text-paper">Platform overview</h1>
        </div>
        <div className="flex items-center gap-3">
          {user && <span className="text-sm text-paper/60">{user.name}</span>}
          <Link to="/editor" className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-sm text-paper/90 hover:bg-blueprint-800">
            Back to editor
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-sm text-paper/90 hover:bg-blueprint-800 hover:text-amber"
          >
            Sign out
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-node-cache">{error}</p>}
      {loading && <p className="text-sm text-paper/50">Loading…</p>}

      {adminStats && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total users" value={adminStats.userCount} />
          <StatCard label="Total projects" value={adminStats.projectCount} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-4">
          <p className="spec-plate mb-3 text-blueprint-line">Users ({adminUsers.length})</p>
          <div className="flex flex-col divide-y divide-blueprint-line/20">
            {adminUsers.map((u) => (
              <div key={u._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-paper/90">
                    {u.name}
                    {u.isAdmin && <span className="ml-2 rounded-sm bg-amber/20 px-1.5 py-0.5 text-[10px] uppercase text-amber">Admin</span>}
                  </p>
                  <p className="truncate text-xs text-paper/50">{u.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteUser(u._id)}
                  className="shrink-0 rounded-sm border border-blueprint-line/40 px-2 py-1 text-xs text-node-cache hover:bg-node-cache/10"
                >
                  Delete
                </button>
              </div>
            ))}
            {adminUsers.length === 0 && !loading && <p className="py-2 text-xs text-paper/40">No users yet.</p>}
          </div>
        </section>

        <section className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-4">
          <p className="spec-plate mb-3 text-blueprint-line">Projects ({adminProjects.length})</p>
          <div className="flex flex-col divide-y divide-blueprint-line/20">
            {adminProjects.map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-paper/90">{p.name}</p>
                  <p className="truncate text-xs text-paper/50">
                    {p.owner?.name || 'Unknown owner'} · {p.architectureStyle}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProject(p._id)}
                  className="shrink-0 rounded-sm border border-blueprint-line/40 px-2 py-1 text-xs text-node-cache hover:bg-node-cache/10"
                >
                  Delete
                </button>
              </div>
            ))}
            {adminProjects.length === 0 && !loading && <p className="py-2 text-xs text-paper/40">No projects yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md border border-blueprint-line/30 bg-blueprint-900/60 p-4">
      <p className="font-display text-2xl font-bold text-amber">{value}</p>
      <p className="spec-plate mt-1 text-blueprint-line">{label}</p>
    </div>
  );
}