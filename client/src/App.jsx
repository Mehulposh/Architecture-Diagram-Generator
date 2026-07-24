import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Editor from './pages/Editor';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import useDiagramStore from './store/useDiagramStore';

function RequireAuth({ children }) {
  const token = useDiagramStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const token = useDiagramStore((s) => s.token);
  const user = useDiagramStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/editor" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <Projects />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/editor"
        element={
          <RequireAuth>
            <Editor />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/editor" replace />} />
    </Routes>
  );
}