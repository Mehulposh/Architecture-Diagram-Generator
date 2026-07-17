import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import client from '../api/client';
import { connectSocket, getSocket, disconnectSocket } from '../api/socket';

let broadcastTimer = null;
function scheduleBroadcast(get) {
  clearTimeout(broadcastTimer);
  broadcastTimer = setTimeout(() => get().broadcastDiagram(), 200);
}

const useDiagramStore = create((set, get) => ({
  // --- auth ---
  user: JSON.parse(localStorage.getItem('adg_user') || 'null'),
  token: localStorage.getItem('adg_token') || null,

  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    localStorage.setItem('adg_token', data.token);
    localStorage.setItem('adg_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  register: async (name, email, password) => {
    const { data } = await client.post('/auth/register', { name, email, password });
    localStorage.setItem('adg_token', data.token);
    localStorage.setItem('adg_user', JSON.stringify(data.user));
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('adg_token');
    localStorage.removeItem('adg_user');
    disconnectSocket();
    set({ token: null, user: null });
  },

  // --- diagram editor ---
  projectId: null,
  projectName: 'Untitled architecture',
  prompt: '',
  architectureStyle: 'microservices',
  nodes: [],
  edges: [],
  techStack: null,
  documentation: null,
  suggestions: [],
  isGenerating: false,
  error: null,
  collaborators: [],
  collaboratorsOnline: [],
  ownerId: null,
  owner: null,

  docsOpen: false,
  setDocsOpen: (docsOpen) => set({ docsOpen }),

  setPrompt: (prompt) => set({ prompt }),
  setArchitectureStyle: (architectureStyle) => set({ architectureStyle }),
  setProjectName: (projectName) => set({ projectName }),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    scheduleBroadcast(get);
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    scheduleBroadcast(get);
  },
  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: false }, get().edges) });
    scheduleBroadcast(get);
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    });
    scheduleBroadcast(get);
  },

  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
    scheduleBroadcast(get);
  },
  removeSelected: () => {
    set({
      nodes: get().nodes.filter((n) => !n.selected),
      edges: get().edges.filter((e) => !e.selected),
    });
    scheduleBroadcast(get);
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
    scheduleBroadcast(get);
  },

  generateFromPrompt: async () => {
    const { prompt, architectureStyle } = get();
    if (!prompt.trim()) return;
    set({ isGenerating: true, error: null });
    try {
      const { data } = await client.post('/generate', { prompt, architectureStyle });
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        techStack: data.techStack || null,
        documentation: data.documentation || null,
        architectureStyle: data.architectureStyle || architectureStyle,
        isGenerating: false,
      });
    } catch (err) {
      set({ isGenerating: false, error: err.response?.data?.error || 'Generation failed.' });
    }
  },

  fetchSuggestions: async () => {
    const { nodes, edges } = get();
    try {
      const { data } = await client.post('/generate/suggestions', { nodes, edges });
      set({ suggestions: data.suggestions || [] });
    } catch (err) {
      set({ error: 'Could not fetch suggestions.' });
    }
  },

  saveProject: async () => {
    const { projectId, projectName, prompt, architectureStyle, nodes, edges, techStack, documentation, user } = get();
    const payload = { name: projectName, prompt, architectureStyle, nodes, edges, techStack, documentation };
    if (projectId) {
      const { data } = await client.put(`/projects/${projectId}`, { ...payload, saveVersion: true });
      return data;
    }
    const { data } = await client.post('/projects', payload);
    set({
      projectId: data._id,
      ownerId: user?.id || null,
      owner: user ? { _id: user.id, name: user.name, email: user.email } : null,
    });
    return data;
  },

  loadProject: async (id) => {
    const { data } = await client.get(`/projects/${id}`);
    set({
      projectId: data._id,
      projectName: data.name,
      prompt: data.prompt,
      architectureStyle: data.architectureStyle,
      nodes: data.nodes || [],
      edges: data.edges || [],
      techStack: data.techStack || null,
      documentation: data.documentation || null,
      collaborators: data.collaborators || [],
      owner: data.owner && data.owner.name ? data.owner : null,
      ownerId: data.owner?._id || data.owner || null,
      collaboratorsOnline: [],
    });
  },

  resetProject: () =>
    set({
      projectId: null,
      projectName: 'Untitled architecture',
      prompt: '',
      nodes: [],
      edges: [],
      techStack: null,
      documentation: null,
      suggestions: [],
      collaborators: [],
      collaboratorsOnline: [],
      ownerId: null,
      owner: null,
    }),

  // --- projects list ("My projects") ---
  projects: [],
  fetchProjects: async () => {
    const { data } = await client.get('/projects');
    set({ projects: data });
  },

  // --- real-time collaboration ---
  connectRealtime: () => {
    const { token, projectId } = get();
    if (!token || !projectId) return;
    const socket = connectSocket(token);

    socket.emit('project:join', projectId);

    socket.off('presence:sync').on('presence:sync', ({ userIds }) => {
      set({ collaboratorsOnline: userIds });
    });

    socket.off('diagram:update').on('diagram:update', ({ patch }) => {
      set({
        nodes: patch.nodes ?? get().nodes,
        edges: patch.edges ?? get().edges,
      });
    });

    socket.off('collaborator:joined').on('collaborator:joined', ({ userId }) => {
      set({ collaboratorsOnline: [...new Set([...get().collaboratorsOnline, userId])] });
    });

    socket.off('collaborator:left').on('collaborator:left', ({ userId }) => {
      set({ collaboratorsOnline: get().collaboratorsOnline.filter((id) => id !== userId) });
    });
  },

  disconnectRealtime: () => {
    const { projectId } = get();
    const socket = getSocket();
    if (socket && projectId) socket.emit('project:leave', projectId);
    set({ collaboratorsOnline: [] });
  },

  broadcastDiagram: () => {
    const { projectId, nodes, edges } = get();
    const socket = getSocket();
    if (socket && projectId) {
      socket.emit('diagram:update', { projectId, patch: { nodes, edges } });
    }
  },

  inviteCollaborator: async (email) => {
    const { projectId } = get();
    const { data } = await client.post(`/projects/${projectId}/collaborators`, { email });
    set({ collaborators: data.collaborators });
  },

  removeCollaborator: async (userId) => {
    const { projectId } = get();
    const { data } = await client.delete(`/projects/${projectId}/collaborators/${userId}`);
    set({ collaborators: data.collaborators });
  },

  // --- admin dashboard ---
  adminStats: null,
  adminUsers: [],
  adminProjects: [],

  fetchAdminOverview: async () => {
    const [stats, users, projects] = await Promise.all([
      client.get('/admin/stats'),
      client.get('/admin/users'),
      client.get('/admin/projects'),
    ]);
    set({ adminStats: stats.data, adminUsers: users.data, adminProjects: projects.data });
  },

  deleteAdminUser: async (id) => {
    await client.delete(`/admin/users/${id}`);
    set({ adminUsers: get().adminUsers.filter((u) => u._id !== id) });
  },

  deleteAdminProject: async (id) => {
    await client.delete(`/admin/projects/${id}`);
    set({ adminProjects: get().adminProjects.filter((p) => p._id !== id) });
  },
}));

export default useDiagramStore;