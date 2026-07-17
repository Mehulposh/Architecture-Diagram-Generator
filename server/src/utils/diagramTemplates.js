const COLORS = {
  frontend: '#6D5EF8',
  backend: '#2FB8AC',
  database: '#F2A93B',
  cache: '#F45B69',
  queue: '#9B5DE5',
  'api-gateway': '#3A86FF',
  'load-balancer': '#00B4A6',
  cloud: '#4CC9F0',
  external: '#8D99AE',
};

let autoId = 0;
function nextId(prefix) {
  autoId += 1;
  return `${prefix}-${autoId}`;
}

function makeNode(type, label, description, position) {
  return {
    id: nextId(type),
    type,
    position,
    data: { label, description, color: COLORS[type] || '#94A3B8' },
  };
}

function makeEdge(source, target, label = '', animated = false) {
  return { id: `e-${source}-${target}`, source, target, label, animated };
}

// A generic layered layout used as a deterministic fallback when the AI
// generation step is unavailable (e.g. no GEMINI_API_KEY configured).
function buildFallbackDiagram({ prompt = '', architectureStyle = 'microservices' } = {}) {
  autoId = 0;
  const client = makeNode('frontend', 'Web / Mobile Client', 'React front-end consumed by end users', { x: 40, y: 200 });
  const gateway = makeNode('api-gateway', 'API Gateway', 'Single entry point, routes requests to services', { x: 320, y: 200 });
  const auth = makeNode('backend', 'Auth Service', 'Handles authentication and authorization', { x: 620, y: 60 });
  const core = makeNode('backend', 'Core Service', 'Primary business logic service', { x: 620, y: 200 });
  const notif = makeNode('backend', 'Notification Service', 'Sends emails, SMS and push notifications', { x: 620, y: 340 });
  const cache = makeNode('cache', 'Redis Cache', 'Caches hot reads and session data', { x: 920, y: 120 });
  const queue = makeNode('queue', 'Message Queue', 'Decouples services via async events', { x: 920, y: 260 });
  const db = makeNode('database', 'Primary Database', 'Persistent storage for core entities', { x: 1180, y: 200 });
  const cloud = makeNode('cloud', 'Cloud Storage', 'Stores media / static assets', { x: 1180, y: 360 });

  const nodes = [client, gateway, auth, core, notif, cache, queue, db, cloud];
  const edges = [
    makeEdge(client.id, gateway.id, 'HTTPS'),
    makeEdge(gateway.id, auth.id, 'gRPC/REST'),
    makeEdge(gateway.id, core.id, 'gRPC/REST'),
    makeEdge(gateway.id, notif.id, 'REST'),
    makeEdge(core.id, cache.id, 'read/write'),
    makeEdge(core.id, db.id, 'query'),
    makeEdge(core.id, queue.id, 'publish', true),
    makeEdge(queue.id, notif.id, 'consume', true),
    makeEdge(notif.id, cloud.id, 'store attachment'),
  ];

  // One bullet per component, built directly from the node list rather than
  // hand-picking a few — so every component the diagram actually contains
  // gets a line, and adding/removing nodes never leaves the docs out of sync.
  const componentDescriptions = nodes
    .map((n) => `- [[${n.id}]] (${n.type}) — ${n.data.description}`)
    .join('\n');

  return {
    nodes,
    edges,
    techStack: {
      frontend: ['React.js', 'Tailwind CSS'],
      backend: ['Node.js', 'Express.js'],
      database: ['MongoDB', 'PostgreSQL'],
      messaging: ['Kafka', 'Redis Pub/Sub'],
      cloud: ['AWS S3', 'Docker'],
      monitoring: ['Prometheus', 'Grafana'],
    },
    // Documentation references components as [[node-id]] tokens rather than
    // hardcoded names. The client resolves these to each component's *current*
    // label at render/export time (see frontend/src/utils/resolveRefs.js), so
    // renaming a node never leaves stale names behind in prose.
    documentation: {
      systemOverview:
        `A ${architectureStyle} architecture generated from the prompt: "${prompt}". ` +
        `Requests enter through [[${client.id}]] and reach [[${gateway.id}]], which is the single entry point for all traffic. ` +
        `From there, requests are routed to whichever backend service owns that responsibility: [[${auth.id}]] handles login and authorization, ` +
        `[[${core.id}]] implements the application's core business logic, and [[${notif.id}]] handles asynchronous user communications. ` +
        `[[${core.id}]] reads and writes through [[${cache.id}]] for hot data and [[${db.id}]] for persistent storage, and publishes domain events onto ` +
        `[[${queue.id}]] so [[${notif.id}]] can react to them without blocking the request path. Generated or uploaded assets are stored in [[${cloud.id}]].`,
      componentDescriptions,
      apiFlow: `Client -> [[${gateway.id}]] -> [[${auth.id}]] (token check) -> [[${core.id}]] -> Database / Cache. [[${core.id}]] publishes domain events to [[${queue.id}]], consumed by [[${notif.id}]].`,
      databaseDesign: `[[${db.id}]] stores normalized core entities. [[${cache.id}]] stores frequently accessed reads and session tokens with TTL eviction.`,
      deploymentGuidelines: 'Each service is containerized with Docker and deployed independently. Use a load balancer in front of stateless services and horizontal auto-scaling based on CPU/queue depth.',
    },
  };
}

const STATIC_TEMPLATES = {
  'food-delivery': { label: 'Food Delivery App', style: 'microservices' },
  'e-commerce': { label: 'E-commerce Platform', style: 'microservices' },
  'social-media': { label: 'Social Media Application', style: 'event-driven' },
  lms: { label: 'Learning Management System', style: 'layered' },
  'ride-sharing': { label: 'Ride-Sharing Application', style: 'event-driven' },
  banking: { label: 'Banking System', style: 'monolithic' },
  saas: { label: 'SaaS Product', style: 'serverless' },
};

module.exports = { buildFallbackDiagram, STATIC_TEMPLATES, COLORS };