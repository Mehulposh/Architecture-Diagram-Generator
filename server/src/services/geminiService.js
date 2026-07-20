const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildFallbackDiagram } = require('../utils/diagramTemplates');
const { tokenizeDocumentation, ensureComponentCoverage } = require('../utils/componentRefs');

// ---------------------------------------------------------------------------
// Stage 1: domain analysis.
//
// The single biggest reason every generated architecture used to look the
// same regardless of domain was that the model went straight from prompt to
// component list with no intermediate reasoning step. This stage forces that
// reasoning to happen first, as its own structured output, so stage 2 has
// concrete domain facts to design against instead of free-associating.
// ---------------------------------------------------------------------------
const DOMAIN_ANALYSIS_PROMPT = `You are a senior software architect doing requirements analysis before any design
work begins. Given a short natural-language description of an application, identify the project's domain and
requirements. Respond with ONLY valid JSON (no markdown fences, no preamble) matching exactly this shape:

{
  "domain": "string — the business domain in a few words, e.g. 'Food Delivery', 'Hospital Management', 'E-commerce', 'Learning Management System'",
  "appType": "string — the specific kind of application, e.g. 'Two-sided marketplace', 'B2C e-commerce platform', 'Clinical management system'",
  "coreFeatures": ["5-10 concrete, domain-specific features this application needs — not generic CRUD, e.g. for food delivery: 'Live delivery tracking', 'Restaurant menu management', 'Order dispatch to nearest driver'"],
  "userRoles": ["every distinct type of user or actor who interacts with the system, e.g. Customer, Restaurant Owner, Delivery Partner, Admin"],
  "technicalRequirements": ["3-8 notable technical needs implied by the domain, e.g. 'real-time GPS tracking', 'payment processing with refunds', 'HIPAA-compliant record storage', 'video streaming with adaptive bitrate'"],
  "complexity": "simple" | "moderate" | "complex"
}

Be specific to the stated domain. Two different domains (e.g. Food Delivery vs. Hospital Management) must never
produce similar-looking coreFeatures, userRoles, or technicalRequirements — they describe genuinely different
businesses with different actors and different technical needs.`;

// ---------------------------------------------------------------------------
// Stage 2: architecture generation, conditioned on the stage 1 analysis.
// ---------------------------------------------------------------------------
const ARCHITECTURE_SYSTEM_PROMPT = `You are an expert software architect. You will be given a natural-language
project description AND a structured domain analysis (domain, app type, core features, user roles, technical
requirements) that has already been done for this project. Design a JSON architecture diagram that is clearly,
specifically built to serve THAT domain and THOSE features — not a generic template. Respond with ONLY valid
JSON (no markdown fences, no preamble) matching exactly this shape:

{
  "architectureStyle": "monolithic" | "microservices" | "event-driven" | "serverless" | "layered",
  "nodes": [
    {
      "id": "string, unique, kebab-case, ideally reflecting the domain (e.g. 'delivery-tracking-service', not 'service-3')",
      "type": "frontend" | "backend" | "database" | "cache" | "queue" | "api-gateway" | "load-balancer" | "cloud" | "external",
      "position": { "x": number, "y": number },
      "data": {
        "label": "string — a domain-specific, human-readable name (e.g. 'Delivery Partner App', not 'Client')",
        "description": "string — one sentence, canvas-level summary",
        "purpose": "string — 1-2 sentences: what this component is for and why it exists as its own component",
        "responsibilities": ["3-6 short bullet phrases of concrete things this component does"],
        "inputs": ["what data/requests this component receives, and from where"],
        "outputs": ["what data/results this component produces, and where it sends them"],
        "technologies": ["2-5 specific real technologies commonly used to build this kind of component"],
        "communicatesWith": ["the 'id' values (not names) of other nodes in THIS SAME nodes array that this component talks to"],
        "whyItExists": "string — 1 sentence on the specific problem this component solves for THIS domain",
        "realWorldExamples": ["0-3 short real-world product/service names that use a component like this, where genuinely applicable — omit if none fit naturally"]
      }
    }
  ],
  "edges": [
    { "id": "string", "source": "node id", "target": "node id", "label": "string", "animated": boolean }
  ],
  "techStack": {
    "frontend": ["string"], "backend": ["string"], "database": ["string"],
    "messaging": ["string"], "cloud": ["string"], "monitoring": ["string"]
  },
  "documentation": {
    "systemOverview": "string", "componentDescriptions": "string", "apiFlow": "string",
    "databaseDesign": "string", "deploymentGuidelines": "string"
  }
}

Domain-specific component examples (for calibration — your actual output must match the ACTUAL domain given to
you, not necessarily one of these):
- Food Delivery: Customer App, Restaurant Portal, Delivery Partner App, Order Management, Live Location Tracking, Payment Gateway, Notification Service, Inventory, Recommendation Engine.
- E-commerce: Product Catalog, Cart Service, Wishlist, Order Management, Inventory, Payment Gateway, Recommendation Engine, Search, Reviews, Admin Dashboard.
- Hospital Management: Patient Portal, Doctor Portal, Appointment System, Medical Records, Pharmacy, Billing, Authentication, Admin Panel.
- Learning Management System: Student Portal, Instructor Portal, Courses, Assessments, Certificates, Video Service, Authentication, Analytics.
These four examples must NOT look like each other, and your output for a different domain must not look like any
of them either — every domain gets components that reflect ITS actual features and roles from the analysis you
were given, not a generic "Client -> Gateway -> Core Service -> Database" skeleton reused everywhere.

Rules:
- Lay nodes out left-to-right by data flow, spacing x by ~260 and y by ~140 so the diagram doesn't overlap.
- Build components around the ACTUAL coreFeatures and userRoles you were given — if there are 3 user roles, there should usually be a distinct client-facing component per role where that makes sense (e.g. separate apps/portals), not one generic "Client".
- Identify a load balancer / API gateway, relevant backend services, caches, queues and databases where appropriate for the described scale and complexity.
- Flag single points of failure implicitly by adding redundancy notes in "documentation.deploymentGuidelines" rather than as separate fields.
- Keep the node count between 6 and 16 for readability, scaling toward the higher end for "complex" projects and the lower end for "simple" ones.
- CRITICAL: inside every "documentation" field, whenever you refer to a specific component, write it as [[node-id]] using that component's exact "id" from the "nodes" array above — never write the component's plain-text name directly in documentation prose. Example: instead of "Auth Service validates the token", write "[[auth-service]] validates the token". This lets the app substitute the component's current display name automatically if the user renames it later. Node "label", "description", and the rich "data" sub-fields should still use plain, readable text as normal — this token rule only applies inside top-level "documentation".
- CRITICAL: "documentation.componentDescriptions" MUST contain exactly one bullet line for EVERY SINGLE node in the "nodes" array — no exceptions, no omissions. Format each line exactly as: "- [[node-id]] (type) — " followed by 1-2 sentences. Separate lines with \\n.
- "documentation.systemOverview" must be a full walkthrough paragraph (4-8 sentences): describe how a request enters the system, which components it passes through in order, how data flows between the major services, and how the pieces fit together — reference actual components by their [[node-id]] tokens as you go.
- CRITICAL — valid JSON only: never write a literal, unescaped double-quote character inside any string value. If you need to quote or emphasize a term inside descriptive text, use single quotes instead (e.g. write it as a 'special' case, not as a "special" case). Never write a literal line break inside a string value — keep each string on a single line.`;

// ---------------------------------------------------------------------------
// User Flow generation (Feature 5/6). Takes the SAME domainAnalysis already
// computed for the architecture diagram, rather than reclassifying — this is
// what keeps the two artifacts using the same roles/terminology instead of
// drifting independently, and avoids paying for a third domain-analysis call.
// ---------------------------------------------------------------------------
const USER_FLOW_SYSTEM_PROMPT = `You are a UX architect mapping out user flows for a software product. You will be
given a project description and a structured domain analysis (domain, app type, core features, user roles) that
has already been done for this project. Produce a complete, swimlane-style user flow: one sequential path of steps
per user role, showing how each type of user actually moves through the product from entry to goal completion.
Respond with ONLY valid JSON (no markdown fences, no preamble) matching exactly this shape:

{
  "nodes": [
    {
      "id": "string, unique, kebab-case, e.g. 'customer-login'",
      "role": "string — must exactly match one of the userRoles you were given",
      "stepType": "start" | "action" | "decision" | "end",
      "label": "string — short step name, e.g. 'Browse restaurants'",
      "description": "string — 1 sentence on what happens at this step and, if relevant, what the system does in response",
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [
    { "id": "string", "source": "node id", "target": "node id", "label": "string — e.g. 'yes'/'no' out of a decision, or blank for a normal step", "animated": boolean }
  ],
  "userFlowOverview": "string — a full walkthrough (4-8 sentences) of the complete journey across all roles: the main path, key decision points, alternate/error paths, and how one role's actions trigger steps for another role (e.g. a customer placing an order triggering a delivery partner's flow). Whenever you refer to a specific step, write it as [[node-id]] using that step's exact id from the nodes array — never write the step's plain-text label directly in this overview."
}

Rules:
- Give every userRole from the domain analysis its own lane: assign each role a fixed y position (e.g. role 1 at y=80, role 2 at y=300, role 3 at y=520, spacing ~220 apart) and lay that role's own steps left-to-right along that y by increasing x (~220 apart, starting near x=40).
- Every role's lane must start with exactly one "start" step and end with at least one "end" step.
- Include at least one "decision" step somewhere in the flow where realistic (e.g. "Payment successful?", "In delivery range?") with edges labeled for each branch outcome.
- Cross-role edges are expected and encouraged where one role's action triggers another role's step (e.g. customer's "Place order" step connects to the restaurant's "Receive order" step) — these edges commonly cross lanes vertically, which is normal and correct.
- Keep each role's lane to a reasonable 4-10 steps; total step count across all roles should stay under ~35 for readability.
- CRITICAL — valid JSON only: never write a literal, unescaped double-quote character inside any string value (use single quotes for emphasis instead), and never write a literal line break inside a string value.`;

let cachedClient = null;
const modelCache = {};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') return null;
  if (!cachedClient) cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
}

function getModel(systemInstruction, cacheKey) {
  const client = getClient();
  if (!client) return null;

  if (!modelCache[cacheKey]) {
    modelCache[cacheKey] = client.getGenerativeModel({
      // "gemini-flash-latest" is an alias Google keeps pointed at whichever
      // flash-tier model is currently recommended for new API keys. Pinning
      // to a dated version (e.g. "gemini-1.5-flash", "gemini-2.5-flash")
      // works until Google retires that specific version for new
      // projects/regions, which happens periodically — this alias avoids
      // that entire failure mode. Override via GEMINI_MODEL if you need a
      // specific pinned version instead (e.g. for reproducibility).
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
      systemInstruction,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });
  }
  return modelCache[cacheKey];
}

// Finds the first balanced {...} object in raw model output, ignoring
// anything before or after it (markdown fences, stray commentary, etc), AND
// repairs the two most common ways LLMs produce invalid JSON:
//   1. A literal, unescaped newline/tab/carriage-return inside a string
//      value instead of the escaped "\n" JSON requires.
//   2. A literal, unescaped quote inside a string value (e.g. the model
//      quoting a term for emphasis without escaping it) — this is what
//      actually produces "Expected ',' or '}' after property value" errors,
//      since the parser correctly-per-spec treats that quote as the string's
//      end, then chokes on whatever real text follows it.
// For (2), a bare unescaped quote is genuinely ambiguous — the fix here is a
// lookahead heuristic: after a quote, if what follows (skipping whitespace)
// doesn't look like valid JSON continuation (`,`, `}`, `]`, `:`, or end of
// input), it's almost certainly a literal quote the model forgot to escape,
// not a real string terminator — so it gets escaped in place instead.
function extractJsonObject(raw) {
  const start = raw.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in model response.');

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let end = -1;
  const out = [];

  const looksLikeRealTerminator = (fromIdx) => {
    let j = fromIdx;
    while (j < raw.length && /\s/.test(raw[j])) j++;
    const next = raw[j];
    return next === undefined || next === ',' || next === '}' || next === ']' || next === ':';
  };

  for (let i = start; i < raw.length; i++) {
    const char = raw[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        out.push(char);
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        out.push(char);
        continue;
      }
      if (char === '"') {
        if (looksLikeRealTerminator(i + 1)) {
          inString = false;
          out.push(char);
        } else {
          out.push('\\"');
        }
        continue;
      }
      if (char === '\n') { out.push('\\n'); continue; }
      if (char === '\r') { out.push('\\r'); continue; }
      if (char === '\t') { out.push('\\t'); continue; }
      out.push(char);
      continue;
    }

    out.push(char);
    if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }

  if (end === -1) throw new Error('Unbalanced braces in model response — JSON object never closed.');
  return out.join('');
}

function parseJsonResponse(result) {
  const raw = result.response.text().trim();
  return JSON.parse(extractJsonObject(raw));
}

// Best-effort fallback domain guess, used only when Gemini is unavailable.
// This is intentionally simple keyword matching, not real classification —
// the fallback diagram itself stays generic regardless (see diagramTemplates.js),
// so this exists purely to give the UI something honest to show rather than
// leaving the domain panel empty.
function heuristicDomainAnalysis(prompt = '') {
  const text = prompt.toLowerCase();
  const rules = [
    { test: /food|restaurant|delivery|meal/, domain: 'Food Delivery', appType: 'On-demand delivery marketplace', userRoles: ['Customer', 'Restaurant', 'Delivery Partner', 'Admin'] },
    { test: /shop|commerce|store|cart|product/, domain: 'E-commerce', appType: 'B2C e-commerce platform', userRoles: ['Shopper', 'Seller', 'Admin'] },
    { test: /hospital|patient|doctor|clinic|health/, domain: 'Hospital Management', appType: 'Clinical management system', userRoles: ['Patient', 'Doctor', 'Staff', 'Admin'] },
    { test: /course|student|learn|lms|instructor/, domain: 'Learning Management System', appType: 'Online learning platform', userRoles: ['Student', 'Instructor', 'Admin'] },
    { test: /ride|driver|taxi|trip/, domain: 'Ride-Sharing', appType: 'On-demand transportation marketplace', userRoles: ['Rider', 'Driver', 'Admin'] },
    { test: /bank|payment|finance|wallet/, domain: 'Banking / FinTech', appType: 'Financial services platform', userRoles: ['Account Holder', 'Support Agent', 'Admin'] },
    { test: /social|post|feed|follow/, domain: 'Social Media', appType: 'Social networking platform', userRoles: ['User', 'Moderator', 'Admin'] },
    { test: /chat|message|messaging/, domain: 'Real-time Messaging', appType: 'Chat / messaging application', userRoles: ['User', 'Admin'] },
  ];
  const match = rules.find((r) => r.test.test(text));

  return {
    domain: match?.domain || 'General Web Application',
    appType: match?.appType || 'Custom web application',
    coreFeatures: [],
    userRoles: match?.userRoles || ['User', 'Admin'],
    technicalRequirements: [],
    complexity: 'moderate',
  };
}

async function analyzeDomain(prompt) {
  const model = getModel(DOMAIN_ANALYSIS_PROMPT, 'domain-analysis');
  if (!model) return heuristicDomainAnalysis(prompt);

  try {
    const result = await model.generateContent(`Application description: ${prompt}`);
    return parseJsonResponse(result);
  } catch (err) {
    console.error('[geminiService] domain analysis failed, using heuristic guess:', err.message);
    return heuristicDomainAnalysis(prompt);
  }
}

async function generateDiagramFromPrompt({ prompt, architectureStyle, diagramLevel }) {
  const client = getClient();

  if (!client) {
    // No key configured: fall back to a deterministic template so the app
    // remains usable in local/dev environments without Gemini access.
    const diagram = buildFallbackDiagram({ prompt, architectureStyle });
    return { ...diagram, domainAnalysis: heuristicDomainAnalysis(prompt) };
  }

  // Stage 1: figure out what kind of application this actually is before
  // designing anything, so stage 2 has concrete facts to build against
  // instead of guessing generically from the raw prompt alone.
  const domainAnalysis = await analyzeDomain(prompt);

  try {
    const model = getModel(ARCHITECTURE_SYSTEM_PROMPT, 'architecture');
    const userMessage = [
      `Application description: ${prompt}`,
      `Preferred architecture style: ${architectureStyle || 'let the AI decide'}`,
      `Diagram level requested: ${diagramLevel || 'high-level'}`,
      `Domain analysis already completed for this project (design specifically for this, do not ignore it):`,
      JSON.stringify(domainAnalysis, null, 2),
    ].join('\n');

    const result = await model.generateContent(userMessage);
    const parsed = parseJsonResponse(result);

    // Normalize edges to always carry an id.
    parsed.edges = (parsed.edges || []).map((e, i) => ({ id: e.id || `e-${i}`, animated: false, label: '', ...e }));

    // Repair any documentation text where the model wrote a plain component
    // name instead of following the [[node-id]] token convention.
    parsed.documentation = tokenizeDocumentation(parsed.documentation, parsed.nodes);

    // Guarantee every node is actually documented, even if the model ignored
    // the "cover every component" instruction for some of them.
    parsed.documentation = ensureComponentCoverage(parsed.documentation, parsed.nodes);

    parsed.domainAnalysis = domainAnalysis;

    return parsed;
  } catch (err) {
    console.error('[geminiService] generation failed, using fallback:', err.message);
    const diagram = buildFallbackDiagram({ prompt, architectureStyle });
    return { ...diagram, domainAnalysis };
  }
}

async function generateUserFlow({ prompt, domainAnalysis }) {
  const model = getModel(USER_FLOW_SYSTEM_PROMPT, 'user-flow');

  if (!model) {
    return buildFallbackUserFlow({ domainAnalysis });
  }

  try {
    const userMessage = [
      `Application description: ${prompt}`,
      `Domain analysis already completed for this project (use the SAME userRoles, do not invent new ones or rename them):`,
      JSON.stringify(domainAnalysis, null, 2),
    ].join('\n');

    const result = await model.generateContent(userMessage);
    const parsed = parseJsonResponse(result);

    parsed.edges = (parsed.edges || []).map((e, i) => ({ id: e.id || `fe-${i}`, animated: false, label: '', ...e }));

    return {
      nodes: parsed.nodes || [],
      edges: parsed.edges || [],
      userFlowOverview: parsed.userFlowOverview || '',
    };
  } catch (err) {
    console.error('[geminiService] user flow generation failed, using fallback:', err.message);
    return buildFallbackUserFlow({ domainAnalysis });
  }
}

// Deterministic fallback: a single generic role's flow, used only when
// Gemini is unavailable or the call fails. Like the architecture fallback,
// this is intentionally simple rather than pretending to be domain-aware.
function buildFallbackUserFlow({ domainAnalysis } = {}) {
  const role = domainAnalysis?.userRoles?.[0] || 'User';
  const nodes = [
    { id: 'flow-start', role, stepType: 'start', label: 'Open app', description: `${role} opens the application.`, position: { x: 40, y: 80 } },
    { id: 'flow-login', role, stepType: 'action', label: 'Log in', description: 'Authenticate to access personalized features.', position: { x: 260, y: 80 } },
    { id: 'flow-browse', role, stepType: 'action', label: 'Browse / use core feature', description: 'Engage with the main functionality of the product.', position: { x: 480, y: 80 } },
    { id: 'flow-decision', role, stepType: 'decision', label: 'Action successful?', description: 'The system evaluates whether the requested action completed.', position: { x: 700, y: 80 } },
    { id: 'flow-end', role, stepType: 'end', label: 'Goal completed', description: 'The user reaches their goal for this session.', position: { x: 920, y: 20 } },
    { id: 'flow-retry', role, stepType: 'action', label: 'Retry / resolve error', description: 'The user corrects an issue and tries again.', position: { x: 920, y: 160 } },
  ];
  const edges = [
    { id: 'fe-1', source: 'flow-start', target: 'flow-login', label: '', animated: false },
    { id: 'fe-2', source: 'flow-login', target: 'flow-browse', label: '', animated: false },
    { id: 'fe-3', source: 'flow-browse', target: 'flow-decision', label: '', animated: false },
    { id: 'fe-4', source: 'flow-decision', target: 'flow-end', label: 'yes', animated: false },
    { id: 'fe-5', source: 'flow-decision', target: 'flow-retry', label: 'no', animated: false },
    { id: 'fe-6', source: 'flow-retry', target: 'flow-browse', label: '', animated: true },
  ];

  return {
    nodes,
    edges,
    userFlowOverview: `The ${role} opens the app and logs in before reaching [[flow-browse]], the core feature of the product. At [[flow-decision]], the system checks whether the action succeeded: on success the ${role} reaches [[flow-end]]; on failure they're routed to [[flow-retry]] and looped back to try again.`,
  };
}

module.exports = { generateDiagramFromPrompt, generateUserFlow };