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

function makeNode(type, label, description, position, rich = {}) {
  return {
    id: nextId(type),
    type,
    position,
    data: {
      label,
      description,
      color: COLORS[type] || '#94A3B8',
      purpose: rich.purpose || description,
      responsibilities: rich.responsibilities || [],
      inputs: rich.inputs || [],
      outputs: rich.outputs || [],
      technologies: rich.technologies || [],
      communicatesWith: [], // filled in after edges are built, see below
      whyItExists: rich.whyItExists || '',
      realWorldExamples: rich.realWorldExamples || [],
    },
  };
}

// Derives each node's communicatesWith list straight from the edges, so it's
// always internally consistent with the diagram itself rather than hand-authored
// and liable to drift.
function deriveCommunicatesWith(nodes, edges) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const source = byId[edge.source];
    const target = byId[edge.target];
    if (source && !source.data.communicatesWith.includes(edge.target)) {
      source.data.communicatesWith.push(edge.target);
    }
    if (target && !target.data.communicatesWith.includes(edge.source)) {
      target.data.communicatesWith.push(edge.source);
    }
  }
}

function makeEdge(source, target, label = '', animated = false) {
  return { id: `e-${source}-${target}`, source, target, label, animated };
}

// A generic layered layout used as a deterministic fallback when the AI
// generation step is unavailable (e.g. no GEMINI_API_KEY configured).
function buildFallbackDiagram({ prompt = '', architectureStyle = 'microservices' } = {}) {
  autoId = 0;
  const client = makeNode('frontend', 'Web / Mobile Client', 'React front-end consumed by end users', { x: 40, y: 200 }, {
    purpose: 'The application surface end users actually interact with.',
    responsibilities: ['Render UI', 'Collect user input', 'Call backend APIs', 'Handle client-side routing'],
    inputs: ['User interactions (clicks, form input)'],
    outputs: ['HTTP requests to the API Gateway'],
    technologies: ['React', 'React Router', 'Axios'],
    whyItExists: 'Every system needs a way for users to actually reach it.',
    realWorldExamples: [],
  });
  const gateway = makeNode('api-gateway', 'API Gateway', 'Single entry point, routes requests to services', { x: 320, y: 200 }, {
    purpose: 'Centralizes routing, auth checks, and rate limiting so backend services stay simple.',
    responsibilities: ['Route requests to the correct service', 'Enforce authentication', 'Rate limiting', 'Request/response logging'],
    inputs: ['HTTP requests from the client'],
    outputs: ['Proxied requests to backend services'],
    technologies: ['Nginx', 'Express', 'Kong'],
    whyItExists: 'Without a single entry point, every client would need to know the address of every backend service directly.',
    realWorldExamples: ['Kong', 'AWS API Gateway'],
  });
  const auth = makeNode('backend', 'Auth Service', 'Handles authentication and authorization', { x: 620, y: 60 }, {
    purpose: 'Owns identity: who a user is and what they are allowed to do.',
    responsibilities: ['User registration and login', 'Issue and verify tokens', 'Role/permission checks'],
    inputs: ['Credentials, tokens'],
    outputs: ['Signed JWTs, auth decisions'],
    technologies: ['JWT', 'bcrypt', 'OAuth'],
    whyItExists: 'Centralizing identity avoids every service reimplementing its own login logic.',
    realWorldExamples: ['Auth0', 'Firebase Auth'],
  });
  const core = makeNode('backend', 'Core Service', 'Primary business logic service', { x: 620, y: 200 }, {
    purpose: "Implements the application's main business rules and workflows.",
    responsibilities: ['Process core domain logic', 'Coordinate reads/writes to the database', 'Publish domain events'],
    inputs: ['Authenticated API requests'],
    outputs: ['Domain data, published events'],
    technologies: ['Node.js', 'Express'],
    whyItExists: "This is where the application's actual purpose lives, separated from cross-cutting concerns like auth or notifications.",
    realWorldExamples: [],
  });
  const notif = makeNode('backend', 'Notification Service', 'Sends emails, SMS and push notifications', { x: 620, y: 340 }, {
    purpose: 'Delivers asynchronous communications to users without blocking the request that triggered them.',
    responsibilities: ['Consume events from the queue', 'Render notification templates', 'Send via email/SMS/push providers'],
    inputs: ['Events from the message queue'],
    outputs: ['Emails, SMS, push notifications'],
    technologies: ['SendGrid', 'Twilio', 'Firebase Cloud Messaging'],
    whyItExists: 'Sending a notification can be slow or fail transiently; doing it asynchronously keeps the triggering request fast.',
    realWorldExamples: ['SendGrid', 'Twilio'],
  });
  const cache = makeNode('cache', 'Redis Cache', 'Caches hot reads and session data', { x: 920, y: 120 }, {
    purpose: 'Reduces database load and latency for frequently accessed data.',
    responsibilities: ['Cache hot reads', 'Store session data', 'TTL-based eviction'],
    inputs: ['Read/write requests from Core Service'],
    outputs: ['Cached values'],
    technologies: ['Redis'],
    whyItExists: 'Hitting the primary database for every read does not scale; a cache absorbs the repetitive load.',
    realWorldExamples: ['Redis', 'Memcached'],
  });
  const queue = makeNode('queue', 'Message Queue', 'Decouples services via async events', { x: 920, y: 260 }, {
    purpose: 'Lets services communicate asynchronously without being directly coupled or online at the same time.',
    responsibilities: ['Buffer domain events', 'Guarantee delivery to consumers', 'Decouple producers from consumers'],
    inputs: ['Published domain events'],
    outputs: ['Delivered events to subscribers'],
    technologies: ['Kafka', 'RabbitMQ', 'Redis Pub/Sub'],
    whyItExists: 'Without a queue, a slow or down consumer would block the producer directly.',
    realWorldExamples: ['Kafka', 'RabbitMQ'],
  });
  const db = makeNode('database', 'Primary Database', 'Persistent storage for core entities', { x: 1180, y: 200 }, {
    purpose: 'Durable source of truth for all core application data.',
    responsibilities: ['Persist core entities', 'Enforce data integrity', 'Serve queries from Core Service'],
    inputs: ['Writes from Core Service'],
    outputs: ['Query results'],
    technologies: ['MongoDB', 'PostgreSQL'],
    whyItExists: 'Application state has to live somewhere durable that survives a service restart.',
    realWorldExamples: [],
  });
  const cloud = makeNode('cloud', 'Cloud Storage', 'Stores media / static assets', { x: 1180, y: 360 }, {
    purpose: 'Stores large binary assets outside the primary database, where they are expensive to keep.',
    responsibilities: ['Store uploaded/generated files', 'Serve assets via CDN'],
    inputs: ['File uploads/attachments'],
    outputs: ['Public/signed URLs'],
    technologies: ['AWS S3', 'Cloudflare R2'],
    whyItExists: 'Databases are not designed to efficiently store and serve large binary files.',
    realWorldExamples: ['AWS S3', 'Cloudinary'],
  });

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

  deriveCommunicatesWith(nodes, edges);

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