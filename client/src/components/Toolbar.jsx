import { useState } from 'react';
import { toPng, toSvg } from 'html-to-image';
import useDiagramStore from '../store/useDiagramStore';
import { Link } from 'react-router-dom';

export default function Toolbar() {
  const { projectName, setProjectName, saveProject, user, logout } = useDiagramStore();
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    setStatus('Saving…');
    try {
      await saveProject();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
    setTimeout(() => setStatus(''), 1800);
  };

  const download = (dataUrl, ext) => {
    const link = document.createElement('a');
    link.download = `${projectName || 'architecture'}.${ext}`;
    link.href = dataUrl;
    link.click();
  };

  const exportAs = async (format) => {
    const el = document.querySelector('.react-flow');
    if (!el) return;
    const dataUrl = format === 'png' ? await toPng(el) : await toSvg(el);
    download(dataUrl, format);
  };

  return (
    <header className="flex items-center justify-between border-b border-blueprint-line/30 bg-blueprint-950 px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold text-paper">Blueprint</span>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="rounded-sm border border-transparent bg-transparent px-2 py-1 font-body text-sm text-paper/80 hover:border-blueprint-line/30 focus:border-amber"
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        {status && <span className="text-xs text-node-cloud">{status}</span>}
        <button onClick={handleSave} className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800">
          Save
        </button>
        <button onClick={() => exportAs('png')} className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800">
          Export PNG
        </button>
        <button onClick={() => exportAs('svg')} className="rounded-sm border border-blueprint-line/40 px-3 py-1.5 text-paper/90 hover:bg-blueprint-800">
          Export SVG
        </button>
        {user && (
          <div className="ml-3 flex items-center gap-2 border-l border-blueprint-line/30 pl-3">
            <span className="text-paper/60">{user.name}</span>
            <button onClick={logout} className="text-paper/50 hover:text-amber">Sign out</button>
          </div>
        )}
        {user.isAdmin && (
          <Link to="/admin" className="text-paper/60 hover:text-amber">
            Admin
          </Link>
        )}
      </div>
    </header>
  );
}