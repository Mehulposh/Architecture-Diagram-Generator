import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import client from '../api/client';

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

  setPrompt: (prompt) => set({ prompt }),
  setArchitectureStyle: (architectureStyle) => set({ architectureStyle }),
  setProjectName: (projectName) => set({ projectName }),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge({ ...connection, animated: false }, get().edges) }),

  updateNodeData: (id, data) =>
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    }),

  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  removeSelected: () =>
    set({
      nodes: get().nodes.filter((n) => !n.selected),
      edges: get().edges.filter((e) => !e.selected),
    }),

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
    const { projectId, projectName, prompt, architectureStyle, nodes, edges, techStack, documentation } = get();
    const payload = { name: projectName, prompt, architectureStyle, nodes, edges, techStack, documentation };
    if (projectId) {
      const { data } = await client.put(`/projects/${projectId}`, { ...payload, saveVersion: true });
      return data;
    }
    const { data } = await client.post('/projects', payload);
    set({ projectId: data._id });
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
    });
  },
}));

export default useDiagramStore;