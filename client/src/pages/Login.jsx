import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDiagramStore from '../store/useDiagramStore';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login, register } = useDiagramStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/editor');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <div className="blueprint-canvas flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-md border border-blueprint-line/30 bg-blueprint-900/90 p-8 shadow-2xl">
        <p className="spec-plate mb-1 text-blueprint-line">Blueprint</p>
        <h1 className="mb-6 font-display text-2xl font-bold text-paper">
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'register' && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:border-amber"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:border-amber"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="rounded-sm border border-blueprint-line/30 bg-blueprint-800/70 px-3 py-2 text-sm text-paper placeholder:text-paper/40 focus:border-amber"
          />
          {error && <p className="text-xs text-node-cache">{error}</p>}
          <button type="submit" className="mt-1 rounded-sm bg-amber py-2 font-display text-sm font-semibold text-blueprint-950 hover:opacity-90">
            {mode === 'login' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 w-full text-center text-xs text-paper/50 hover:text-amber"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}