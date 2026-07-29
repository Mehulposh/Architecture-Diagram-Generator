import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { layoutFlow } from "../utils/layoutFlow";
import client from '../api/client';
import { connectSocket, getSocket, disconnectSocket } from '../api/socket';

let broadcastTimer = null;
function scheduleBroadcast(get) {
  clearTimeout(broadcastTimer);
  broadcastTimer = setTimeout(() => get().broadcastDiagram(), 200);
}

// Applied synchronously at import time (before the store or React even
// render) so the correct theme is on <html> for the very first paint —
// doing this inside a useEffect instead would cause a visible flash of the
// wrong theme while the app hydrates.
const initialTheme = localStorage.getItem('adg_theme') === 'light' ? 'light' : 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);

let flowStepCounter = 0;

function nextFlowStepId() {
  flowStepCounter += 1;
  return `step-${Date.now()}-${flowStepCounter}`;
}

let entityCounter = 0;

function nextEntityId() {
  entityCounter += 1;
  return `entity-${Date.now()}-${entityCounter}`;
}

const useDiagramStore = create((set, get) => ({
  // --- theme ---
  theme: initialTheme,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('adg_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

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

  // Fetches fresh account data rather than trusting the localStorage cache,
  // since that can go stale after a profile update.
  fetchProfile: async () => {
    
    const { data } = await client.get('/user/me');
    localStorage.setItem('adg_user', JSON.stringify(data.user));
    set({ user: data.user });
    return data.user;
  },

  updateProfile: async ({ name, email }) => {
    const { data } = await client.put('/user/me', { name, email });
    localStorage.setItem('adg_user', JSON.stringify(data.user));
    set({ user: data.user });
    return data.user;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    await client.put('/user/me/password', { currentPassword, newPassword });
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

  // Current user's permission for the loaded project.
  // owner | editor | viewer | null
  permission: null,

  // Computed permission flags.
  // These are the only values the UI should use.
  isOwner: false,
  isEditor: false,
  canView: true,
  canEdit: true,
  canGenerate: true,
  canDelete: false,
  canInvite: false,
  canManagePermissions: false,
  docsOpen: false,

  setDocsOpen: (docsOpen) =>
    set({
      docsOpen,
      selectedNodeId: docsOpen ? null : get().selectedNodeId,
      selectedEntityId: docsOpen ? null : get().selectedEntityId,
      selectedFlowStepId: docsOpen ? null : get().selectedFlowStepId,
    }),
  domainAnalysis: null,
  
  // --- user flow (one independent diagram per role) ---
  userFlows: [], // [{ role, summary, nodes, edges }]
  selectedFlowRole: null,
  userFlowOverview: '',
  isGeneratingUserFlow: false,
  userFlowError: null,

  setSelectedFlowRole: (role) =>  set({ selectedFlowRole: role }),
  selectedFlowStepId: null,
  setSelectedFlowStepId: (selectedFlowStepId) =>
    set({ selectedFlowStepId, selectedNodeId: null, selectedEntityId: null, docsOpen: selectedFlowStepId ? false : get().docsOpen }),

  // --- ER diagram ---
  erEntities: [],
  erRelationships: [],
  erOverview: '',
  databaseDesignDecisions: '',
  isGeneratingER: false,
  erError: null,
  selectedEntityId: null,
  setSelectedEntityId: (selectedEntityId) => set({ selectedEntityId, selectedNodeId: null, docsOpen: selectedEntityId ? false : get().docsOpen }),
  
  diagramView: 'architecture', // 'architecture' | 'userFlow' | 'er'
  setDiagramView: (diagramView) => set({ diagramView }),
  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId, selectedEntityId: null, docsOpen: selectedNodeId ? false : get().docsOpen }),

  setPrompt: (prompt) => set({ prompt }),
  setArchitectureStyle: (architectureStyle) => set({ architectureStyle }),
  
  computePermissions: (project) => {
    const user = get().user;

    if (!user || !project) {
      return {
        permission: null,
        isOwner: false,
        isEditor: false,
        canView: false,
        canEdit: false,
        canGenerate: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false,
      };
    }

    // Owner
    if (project.owner?._id === user.id) {
      return {
        permission: "owner",

        isOwner: true,
        isEditor: true,

        canView: true,
        canEdit: true,
        canGenerate: true,
        canDelete: true,
        canInvite: true,
        canManagePermissions: true,
      };
    }

    const collaborator = project.collaborators?.find(
      (c) => c.user?._id === user.id
    );

    if (!collaborator) {
      return {
        permission: null,
        isOwner: false,
        isEditor: false,
        canView: false,
        canEdit: false,
        canGenerate: false,
        canDelete: false,
        canInvite: false,
        canManagePermissions: false,
      };
    }

    const editor = collaborator.permission === "editor";

    return {
      permission: collaborator.permission,

      isOwner: false,
      isEditor: editor,

      canView: true,
      canEdit: editor,
      canGenerate: editor,
      canDelete: false,
      canInvite: false,
      canManagePermissions: false,
    };
  },
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
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
    scheduleBroadcast(get);
  },

  // --- user flow editing (scoped to whichever role is currently selected) ---
  onFlowNodesChange: (changes) => {
    const { userFlows, selectedFlowRole } = get();
    set({
      userFlows: userFlows.map((f) =>
        f.role === selectedFlowRole ? { ...f, nodes: applyNodeChanges(changes, f.nodes) } : f
      ),
    });
  },
 
  onFlowEdgesChange: (changes) => {
    const { userFlows, selectedFlowRole } = get();
    set({
      userFlows: userFlows.map((f) =>
        f.role === selectedFlowRole ? { ...f, edges: applyEdgeChanges(changes, f.edges) } : f
      ),
    });
  },

  onFlowConnect: (connection) => {
    const { userFlows, selectedFlowRole } = get();
    set({
      userFlows: userFlows.map((f) =>
        f.role === selectedFlowRole ? { ...f, edges: addEdge({ ...connection, animated: false, label: '' }, f.edges) } : f
      ),
    });
  },
 
  updateFlowStepData: (stepId, patch) => {
    const { userFlows, selectedFlowRole } = get();
    set({
      userFlows: userFlows.map((f) =>
        f.role === selectedFlowRole
          ? { ...f, nodes: f.nodes.map((n) => (n.id === stepId ? { ...n, ...patch } : n)) }
          : f
      ),
    });
  },
 
  addFlowStep: (partialStep) => {
    const { userFlows, selectedFlowRole } = get();
    const step = { id: nextFlowStepId(), stepType: 'action', label: 'New step', description: '', position: { x: 200, y: 200 }, ...partialStep };
    set({
      userFlows: userFlows.map((f) => (f.role === selectedFlowRole ? { ...f, nodes: [...f.nodes, step] } : f)),
    });
  },

  deleteFlowStep: (stepId) => {
    const { userFlows, selectedFlowRole, selectedFlowStepId } = get();
    set({
      userFlows: userFlows.map((f) =>
        f.role === selectedFlowRole
          ? {
              ...f,
              nodes: f.nodes.filter((n) => n.id !== stepId),
              edges: f.edges.filter((e) => e.source !== stepId && e.target !== stepId),
            }
          : f
      ),
      selectedFlowStepId: selectedFlowStepId === stepId ? null : selectedFlowStepId,
    });
  },

  addFlowRole: (roleName) => {
    const trimmed = (roleName || '').trim();
    if (!trimmed) return;
    const { userFlows } = get();
    if (userFlows.some((f) => f.role.toLowerCase() === trimmed.toLowerCase())) return;
    const startId = nextFlowStepId();
    const newFlow = {
      role: trimmed,
      summary: '',
      nodes: [{ id: startId, stepType: 'start', label: 'Start', description: `${trimmed} begins their journey.`, position: { x: 40, y: 80 } }],
      edges: [],
    };
    set({ userFlows: [...userFlows, newFlow], selectedFlowRole: trimmed });
  },
 
  deleteFlowRole: (role) => {
    const { userFlows, selectedFlowRole } = get();
    const remaining = userFlows.filter((f) => f.role !== role);
    set({
      userFlows: remaining,
      selectedFlowRole: selectedFlowRole === role ? remaining[0]?.role || null : selectedFlowRole,
    });
  },

  // --- ER editing ---
  onErNodesChange: (changes) => {
    // Only position/select changes are meaningful here since node content
    // (attributes etc) is edited through EntityDetailsPanel, not dragged.
    const positionChanges = changes.filter((c) => c.type === 'position' && c.position);
    if (positionChanges.length === 0) return;
    const byId = Object.fromEntries(positionChanges.map((c) => [c.id, c.position]));
    set({
      erEntities: get().erEntities.map((e) => (byId[e.id] ? { ...e, position: byId[e.id] } : e)),
    });
  },
 
  onErConnect: (connection) => {
    const id = `er-${Date.now()}`;
    set({
      erRelationships: [
        ...get().erRelationships,
        { id, source: connection.source, target: connection.target, cardinality: '1:N', label: '', description: '', isJunctionTable: false },
      ],
    });
  },

  updateEntityData: (entityId, patch) => {
    set({
      erEntities: get().erEntities.map((e) => (e.id === entityId ? { ...e, ...patch } : e)),
    });
  },
 
  addEntity: () => {
    const id = nextEntityId();
    const entity = {
      id,
      name: 'New Entity',
      position: { x: 200, y: 200 },
      purpose: '',
      attributes: [{ name: 'id', type: 'UUID', description: 'Primary identifier', required: true, isPrimaryKey: true, isForeignKey: false, unique: true }],
    };
    set({ erEntities: [...get().erEntities, entity], selectedEntityId: id });
  },

  deleteEntity: (entityId) => {
    set({
      erEntities: get().erEntities.filter((e) => e.id !== entityId),
      erRelationships: get().erRelationships.filter((r) => r.source !== entityId && r.target !== entityId),
      selectedEntityId: get().selectedEntityId === entityId ? null : get().selectedEntityId,
    });
  },
 
  updateRelationship: (relId, patch) => {
    set({
      erRelationships: get().erRelationships.map((r) => (r.id === relId ? { ...r, ...patch } : r)),
    });
  },
 
  deleteRelationship: (relId) => {
    set({ erRelationships: get().erRelationships.filter((r) => r.id !== relId) });
  },


  generateFromPrompt: async () => {
    if (!get().canGenerate) {
      set({
        error: "You don't have permission to generate diagrams.",
      });

      return;
    }
    const { prompt, architectureStyle } = get();
    if (!prompt.trim()) return;
    set({ isGenerating: true, error: null, selectedNodeId: null });
    try {
      const { data } = await client.post('/generate', { prompt, architectureStyle });
      set({
        nodes: data.nodes || [],
        edges: data.edges || [],
        techStack: data.techStack || null,
        documentation: data.documentation || null,
        domainAnalysis: data.domainAnalysis || null,
        architectureStyle: data.architectureStyle || architectureStyle,
        isGenerating: false,
        // A fresh architecture may have different roles/terminology than
        // whatever user flow was generated before — rather than showing a
        // now-inconsistent flow, clear it and let the user regenerate it.
        userFlows: [],
        selectedFlowRole: null,
        userFlowOverview: '',
        erEntities: [],
        erRelationships: [],
        erOverview: '',
        databaseDesignDecisions: '',
      });
    } catch (err) {
      set({ isGenerating: false, error: err.response?.data?.error || 'Generation failed.' });
    }
  },

  generateUserFlowArtifact: async () => {
  if (!get().canGenerate) {
    set({
      error: "You don't have permission to generate diagrams.",
    });
    return;
  }

  const { prompt, domainAnalysis } = get();

  if (!domainAnalysis?.userRoles?.length) {
    set({
      userFlowError:
        "Generate the architecture diagram first so user roles are known.",
    });
    return;
  }

  set({
    isGeneratingUserFlow: true,
    userFlowError: null,
  });

  try {
    const { data } = await client.post("/generate/user-flow", {
      prompt,
      domainAnalysis,
    });

    // ---------- Layout every flow ----------
    const flows = await Promise.all(
      (data.flows || []).map(async (flow) => {
        const reactFlowNodes = flow.nodes.map((node) => ({
          id: node.id,
          type: "flowStep",
          data: {
            label: node.label,
            description: node.description,
            stepType: node.stepType,
            handoffRole: node.handoffRole,
          },
        }));

        const reactFlowEdges = flow.edges.map((edge) => ({
          ...edge,
          type: edge.type || "smoothstep",
        }));

        const layoutedNodes = await layoutFlow(
          reactFlowNodes,
          reactFlowEdges
        );

        return {
          ...flow,
          nodes: layoutedNodes,
          edges: reactFlowEdges,
        };
      })
    );

    set({
      userFlows: flows,
      selectedFlowRole: flows[0]?.role || null,
      userFlowOverview: data.userFlowOverview || "",
      isGeneratingUserFlow: false,
    });
  } catch (err) {
    set({
      isGeneratingUserFlow: false,
      userFlowError:
        err.response?.data?.error ||
        "User flow generation failed.",
    });
  }
},

  generateERDiagramArtifact: async () => {
    if (!get().canGenerate) {
      set({
        error: "You don't have permission to generate diagrams.",
      });

      return;
    }
    const { prompt, domainAnalysis } = get();
    if (!domainAnalysis?.userRoles?.length) {
      set({ erError: 'Generate the architecture diagram first so the domain is known.' });
      return;
    }
    set({ isGeneratingER: true, erError: null });
    try {
      const { data } = await client.post('/generate/er-diagram', { prompt, domainAnalysis });
      set({
        erEntities: data.entities || [],
        erRelationships: data.relationships || [],
        erOverview: data.erOverview || '',
        databaseDesignDecisions: data.databaseDesignDecisions || '',
        isGeneratingER: false,
      });
    } catch (err) {
      set({ isGeneratingER: false, erError: err.response?.data?.error || 'ER diagram generation failed.' });
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

  saveProject: async (createVersion = false, versionLabel = "") => {
    if (!get().canEdit) {
      throw new Error("You only have Viewer access.");
    }
    const  { 
      projectId,
      projectName, 
      prompt, 
      architectureStyle, 
      nodes, 
      edges, 
      techStack, 
      documentation, 
      domainAnalysis, 
      userFlows, 
      userFlowOverview, 
      erEntities, 
      erRelationships, 
      erOverview, 
      databaseDesignDecisions, 
      user } = get();

    const payload = {
      name: projectName,
      prompt,
      architectureStyle,
      nodes,
      edges,
      techStack,
      documentation: {
        ...documentation,
        userFlowOverview,
        erOverview,
        databaseDesignDecisions,
      },
      domainAnalysis,
      userFlow:{ flows: userFlows },
      erDiagram: {
        entities: erEntities,
        relationships: erRelationships,
      },
    };

    // Update existing project
    if (projectId) {
      const { data } = await client.put(`/projects/${projectId}`, {
        ...payload,
        saveVersion: createVersion,
        versionLabel,
      });

      return data;
    }

    // Create new project
    const { data } = await client.post("/projects", payload);

    set({
      projectId: data._id,
      ownerId: user?.id || null,
      owner: user
        ? {
            _id: user.id,
            name: user.name,
            email: user.email,
          }
        : null,
    });

    return data;
  },

  loadProject: async (id) => {
    const { data } = await client.get(`/projects/${id}`);
    const permissions = get().computePermissions(data);
    console.log("Project Owner:", data.owner);
    console.log("Current User:", get().user);
    console.log("Permissions:", permissions);
    const flows = await Promise.all(
        (data.userFlow?.flows || []).map(async (flow) => {
          console.log("Before layout:", flow.nodes);
          const nodes = await layoutFlow(
            flow.nodes,
            flow.edges
          );
          console.log("After layout:", nodes);
          return {
            ...flow,
            nodes,
          };
      })
    )
    console.log('user flow from the load project function', flows);
    
    set({
      projectId: data._id,
      projectName: data.name,
      prompt: data.prompt,
      architectureStyle: data.architectureStyle,
      nodes: data.nodes || [],
      edges: data.edges || [],
      techStack: data.techStack || null,
      documentation: data.documentation || null,
      domainAnalysis: data.domainAnalysis || null,
      userFlows: flows,
      selectedFlowRole: flows[0]?.role || null,
      userFlowOverview: data.documentation?.userFlowOverview || '',
      erEntities: data.erDiagram?.entities || [],
      erRelationships: data.erDiagram?.relationships || [],
      erOverview: data.documentation?.erOverview || '',
      databaseDesignDecisions: data.documentation?.databaseDesignDecisions || '',
      collaborators: data.collaborators || [],
      owner: data.owner ?? null,
      ownerId: data.owner?._id ?? null,

      ...permissions,
      collaboratorsOnline: [],
      selectedNodeId: null,
      selectedEntityId: null,
      diagramView: 'architecture',
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
      domainAnalysis: null,
      userFlows: [],
      selectedFlowRole: null,
      userFlowOverview: '',
      erEntities: [],
      erRelationships: [],
      erOverview: '',
      databaseDesignDecisions: '',
      diagramView: 'architecture',
      suggestions: [],
      collaborators: [],
      collaboratorsOnline: [],
      ownerId: null,
      owner: null,
      permission: null,

      isOwner: false,
      isEditor: false,

      canView: true,
      canEdit: true,
      canGenerate: true,

      canDelete: false,
      canInvite: false,
      canManagePermissions: false,
      selectedNodeId: null,
      selectedEntityId: null,
      selectedFlowStepId: null,
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

  updateCollaboratorPermission: async (
      userId,
      permission
  ) => {

      const { projectId } = get();

      const { data } = await client.patch(
          `/projects/${projectId}/collaborators/${userId}`,
          {
              permission,
          }
      );

      set({
          collaborators: data.collaborators,
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
    const { data } = await client.post(
        `/projects/${projectId}/collaborators`,
        {
            email,
            permission,
        }
    );
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