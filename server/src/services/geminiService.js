const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildFallbackDiagram } = require('../utils/diagramTemplates');
const { tokenizeDocumentation, ensureComponentCoverage } = require('../utils/componentRefs');

const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});
// const OLLAMA_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

// const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";

async function generateWithGroq(systemPrompt, userPrompt) {

    const completion = await groq.chat.completions.create({

            model:
                process.env.GROQ_MODEL ||
                "llama-3.3-70b-versatile",

            temperature: 0.4,

            response_format: {
                type: "json_object"
            },

            messages: [

                {
                    role: "system",
                    content: systemPrompt
                },

                {
                    role: "user",
                    content: userPrompt
                }

            ]

        });

    return JSON.parse(
        completion.choices[0].message.content
    );

}

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
- "documentation.systemOverview" must be a full walkthrough paragraph (4-8 sentences): describe how a request enters the system, which components it passes through in order, how data flows between the major services, and how the pieces fit together — reference actual components by their [[node-id]] tokens as you go.`;

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
  let model = null;

  if (AI_PROVIDER === "gemini") {
    model = getModel(DOMAIN_ANALYSIS_PROMPT, "domain-analysis");
  }

  try {
    if (AI_PROVIDER === "groq") {
      return await generateWithGroq(
        DOMAIN_ANALYSIS_PROMPT,
        `Application description: ${prompt}`
      );
    }

    const result = await model.generateContent(
      `Application description: ${prompt}`
    );

    return parseJsonResponse(result);
  } catch (err) {
    console.error(
      "[AI Service] domain analysis failed, using heuristic guess:",
      err.message
    );

    return heuristicDomainAnalysis(prompt);
  }
}


async function generateDiagramFromPrompt({ prompt, architectureStyle, diagramLevel }) {
  if (AI_PROVIDER === "gemini" && !getClient()) {
    const diagram = buildFallbackDiagram({ prompt, architectureStyle });

    return {
      ...diagram,
      domainAnalysis: heuristicDomainAnalysis(prompt),
    };
  }

  // Stage 1: figure out what kind of application this actually is before
  // designing anything, so stage 2 has concrete facts to build against
  // instead of guessing generically from the raw prompt alone.
  const domainAnalysis = await analyzeDomain(prompt);

  try {
    let model = null;

    if (AI_PROVIDER === "gemini") {
      model = getModel(ARCHITECTURE_SYSTEM_PROMPT, "architecture");
    }
    const userMessage = [
      `Application description: ${prompt}`,
      `Preferred architecture style: ${architectureStyle || 'let the AI decide'}`,
      `Diagram level requested: ${diagramLevel || 'high-level'}`,
      `Domain analysis already completed for this project (design specifically for this, do not ignore it):`,
      JSON.stringify(domainAnalysis, null, 2),
    ].join('\n');

    let parsed;

    if (AI_PROVIDER === "groq") {

        parsed = await generateWithGroq(
            ARCHITECTURE_SYSTEM_PROMPT,
            userMessage
        );

    } else {

        const result = await model.generateContent(userMessage);

        parsed = parseJsonResponse(result);

    }

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

// ---------------------------------------------------------------------------
// User Flow generation (Feature 5/6). Takes the SAME domainAnalysis already
// computed for the architecture diagram, rather than reclassifying — this is
// what keeps the two artifacts using the same roles/terminology instead of
// drifting independently, and avoids paying for a third domain-analysis call.
//
// Each role gets its OWN independent diagram (not shared lanes on one
// canvas) — this makes them individually viewable, editable, and
// exportable. Since two separate diagrams can't share a literal connecting
// arrow, a point where one role's action triggers another role's process is
// represented as a "handoff" step *inside* the role's own diagram that
// names the other role, rather than a cross-diagram edge.
// ---------------------------------------------------------------------------
const USER_FLOW_SYSTEM_PROMPT = `You are a UX architect mapping out user flows for a software product. You will be
given a project description and a structured domain analysis (domain, app type, core features, user roles) that
has already been done for this project. Produce ONE COMPLETE, INDEPENDENT flow diagram for EVERY SINGLE userRole
given to you — each role's diagram stands entirely on its own (its own steps, its own layout, starting fresh),
not lanes sharing one canvas. Respond with ONLY valid JSON (no markdown fences, no preamble) matching exactly
this shape:

{
  "flows": [
    {
      "role": "string — must exactly match one of the userRoles you were given",
      "summary": "string — 1-2 sentences on this specific role's overall journey through the product",
      "nodes": [
        {
          "id": "string, unique across the WHOLE response, kebab-case, e.g. 'customer-login'",
          "stepType": "start" | "action" | "decision" | "end" | "handoff",
          "label": "string — short step name, e.g. 'Browse restaurants', or for a handoff e.g. 'Order sent to restaurant'",
          "description": "string — 1 sentence on what happens at this step and what the system does in response",
          "position": { "x": number, "y": number },
          "handoffRole": "ONLY when stepType is 'handoff' — the exact name of the OTHER role this step hands control to or receives control from, otherwise omit this field entirely"
        }
      ],
      "edges": [
        { "id": "string", "source": "node id", "target": "node id", "label": "string — e.g. 'yes'/'no' out of a decision, or blank", "animated": boolean }
      ]
    }
  ],
  "userFlowOverview": "string — a full walkthrough (4-8 sentences) of how the roles' journeys connect to each other as a whole system: which role's action triggers which other role's process, in what order, and how the pieces fit together. Whenever you refer to a specific step, write it as [[node-id]] using that step's exact id from wherever it appears in the flows array — never write the step's plain-text label directly in this overview."
}

Rules:
- Produce one "flows" entry for EVERY userRole given to you — no omissions.
- Every role's OWN diagram must start with exactly one "start" step, contain 4-10 steps total, and end with at least one "end" step. All ids and positions are local to that diagram (start x/y fresh near x=40, y=80 for every role — do not try to share coordinate space across roles).
- Include at least one "decision" step where realistic (e.g. "Payment successful?"), with edges labeled for each branch outcome.
- Whenever this role's journey depends on, or triggers, another role's process (e.g. a customer placing an order triggers the restaurant's process, or a driver accepting a trip triggers the rider's tracking view), insert a "handoff" step in THIS role's diagram at that point, with "handoffRole" naming the other role — do NOT invent an edge pointing into another role's diagram, since each diagram is independent.
- "edges" in each flow must only ever connect node ids that exist within that SAME flow's own "nodes" array.
- CRITICAL — valid JSON only: never write a literal, unescaped double-quote character inside any string value (use single quotes for emphasis instead), and never write a literal line break inside a string value.`;

async function generateUserFlow({ prompt, domainAnalysis }) {
  let model = null;

  if (AI_PROVIDER === "gemini") {
    model = getModel(USER_FLOW_SYSTEM_PROMPT, "user-flow");

    if (!model) {
      return buildFallbackUserFlow({ domainAnalysis });
    }
  }

  try {
    const userMessage = [
      `Application description: ${prompt}`,
      `Domain analysis already completed for this project (use the SAME userRoles, do not invent new ones or rename them, and produce one flow per role):`,
      JSON.stringify(domainAnalysis, null, 2),
    ].join('\n');

    console.log("Generating User Flow...");
    let parsed;

    if (AI_PROVIDER === "groq") {

      parsed = await generateWithGroq(
        USER_FLOW_SYSTEM_PROMPT,
        userMessage
      );

    } else {
        const result = await model.generateContent(userMessage);
        parsed = parseJsonResponse(result);
    }
    console.log(parsed);
    const flows = (parsed.flows || []).map((flow, flowIndex) => ({
      role: flow.role || `Role ${flowIndex + 1}`,
      summary: flow.summary || '',
      nodes: flow.nodes || [],
      edges: (flow.edges || []).map((e, i) => ({ id: e.id || `fe-${flowIndex}-${i}`, animated: false, label: '', ...e })),
    }));

    return { flows, userFlowOverview: parsed.userFlowOverview || '' };
  } catch (err) {
    console.error('[geminiService] user flow generation failed, using fallback:', err.message);
    return buildFallbackUserFlow({ domainAnalysis });
  }
}

// Deterministic fallback: one generic role's flow, used only when Gemini is
// unavailable or the call fails. Like the architecture fallback, this is
// intentionally simple rather than pretending to be domain-aware.
function buildFallbackUserFlow({ domainAnalysis } = {}) {
  const role = domainAnalysis?.userRoles?.[0] || 'User';
  const nodes = [
    { id: 'flow-start', stepType: 'start', label: 'Open app', description: `${role} opens the application.`, position: { x: 40, y: 80 } },
    { id: 'flow-login', stepType: 'action', label: 'Log in', description: 'Authenticate to access personalized features.', position: { x: 260, y: 80 } },
    { id: 'flow-browse', stepType: 'action', label: 'Browse / use core feature', description: 'Engage with the main functionality of the product.', position: { x: 480, y: 80 } },
    { id: 'flow-decision', stepType: 'decision', label: 'Action successful?', description: 'The system evaluates whether the requested action completed.', position: { x: 700, y: 80 } },
    { id: 'flow-end', stepType: 'end', label: 'Goal completed', description: 'The user reaches their goal for this session.', position: { x: 920, y: 20 } },
    { id: 'flow-retry', stepType: 'action', label: 'Retry / resolve error', description: 'The user corrects an issue and tries again.', position: { x: 920, y: 160 } },
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
    flows: [
      {
        role,
        summary: `${role} logs in, uses the core feature, and either succeeds or retries after an error.`,
        nodes,
        edges,
      },
    ],
    userFlowOverview: `The ${role} opens the app and logs in before reaching [[flow-browse]], the core feature of the product. At [[flow-decision]], the system checks whether the action succeeded: on success the ${role} reaches [[flow-end]]; on failure they're routed to [[flow-retry]] and looped back to try again. This is a minimal placeholder flow — connect a Gemini API key for flows genuinely designed around this project's actual roles.`,
  };
}

// ---------------------------------------------------------------------------
// ER Diagram generation (Feature 7/8). Same pattern as user flow: reuses the
// SAME domainAnalysis rather than reclassifying, so entity names align with
// the roles/features already established for the architecture and user flow.
// ---------------------------------------------------------------------------
const ER_DIAGRAM_SYSTEM_PROMPT = `You are a database architect designing a schema for a software product. You will
be given a project description and a structured domain analysis (domain, app type, core features, user roles)
already completed for this project. Design a complete, domain-specific entity-relationship model — not a generic
User/Post/Comment template. Respond with ONLY valid JSON (no markdown fences, no preamble) matching exactly this
shape:

{
  "entities": [
    {
      "id": "string, unique, kebab-case, e.g. 'delivery-order'",
      "name": "string — the human-readable entity/table name, e.g. 'Order'",
      "position": { "x": number, "y": number },
      "purpose": "string — 1 sentence on why this entity exists in the schema",
      "attributes": [
        {
          "name": "string, e.g. 'id', 'email', 'status'",
          "type": "string, e.g. 'UUID', 'String', 'Enum', 'Timestamp', 'Decimal', 'Boolean'",
          "description": "string — 1 short phrase",
          "required": boolean,
          "isPrimaryKey": boolean,
          "isForeignKey": boolean,
          "foreignKeyRef": "the 'id' of the entity this references, ONLY if isForeignKey is true, otherwise omit",
          "unique": boolean,
          "defaultValue": "string, only if genuinely relevant, otherwise omit"
        }
      ]
    }
  ],
  "relationships": [
    {
      "id": "string",
      "source": "entity id",
      "target": "entity id",
      "cardinality": "1:1" | "1:N" | "N:1" | "M:N",
      "label": "string — short verb phrase, e.g. 'places', 'contains', 'belongs to'",
      "description": "string — 1 sentence of business reasoning for why this relationship exists and works this way",
      "isJunctionTable": "boolean — true only for M:N relationships realized via a join/junction table"
    }
  ],
  "erOverview": "string — a full walkthrough (4-8 sentences) of the overall database structure: what the core entities are, how they relate, and why the schema is shaped this way for this specific domain. Whenever you refer to a specific entity, write it as [[entity-id]] using that entity's exact id — never write the entity's plain-text name directly in this overview.",
  "databaseDesignDecisions": "string — 3-6 sentences covering: normalization approach, how referential integrity is maintained, why any junction tables exist, indexing/performance considerations, and 2-3 concrete future improvements (e.g. soft deletes, audit tables, read replicas) that would make sense for this specific domain as it scales. Reference entities as [[entity-id]] tokens here too."
}

Rules:
- Every entity needs exactly one attribute with isPrimaryKey: true (conventionally named 'id').
- Foreign keys must reference a real entity id from the SAME entities array via foreignKeyRef.
- Many-to-many relationships MUST be realized either as an explicit junction/join entity in the entities array (with isJunctionTable relationships pointing to it) OR flagged with isJunctionTable: true on the relationship itself if you're representing it directly — be consistent and pick one approach per relationship.
- Base entities on the ACTUAL coreFeatures and userRoles from the domain analysis — e.g. a food delivery app needs Restaurant/Menu/MenuItem/Order/OrderItem/DeliveryPartner, not just generic User/Post.
- Keep entity count between 5 and 14 for readability.
- Lay entities out in a rough left-to-right or grid flow via position (spacing ~320 x, ~260 y) so the diagram doesn't overlap.
- CRITICAL — valid JSON only: never write a literal, unescaped double-quote character inside any string value (use single quotes for emphasis instead), and never write a literal line break inside a string value.`;

async function generateERDiagram({ prompt, domainAnalysis }) {
  let model = null;

  if (AI_PROVIDER === "gemini") {
    model = getModel(ER_DIAGRAM_SYSTEM_PROMPT, "er-diagram");

    if (!model) {
      return buildFallbackERDiagram({ domainAnalysis });
    }
  }

  try {
    const userMessage = [
      `Application description: ${prompt}`,
      `Domain analysis already completed for this project (base entities on these actual features/roles):`,
      JSON.stringify(domainAnalysis, null, 2),
    ].join('\n');

    console.log("Generating ER Diagram...");
    let parsed;

    if (AI_PROVIDER === "groq") {

        parsed = await generateWithGroq(
            ER_DIAGRAM_SYSTEM_PROMPT,
            userMessage
        );

    } else {
        const result = await model.generateContent(userMessage);
        parsed = parseJsonResponse(result);
    }
    console.log(parsed);
    parsed.relationships = (parsed.relationships || []).map((r, i) => ({ id: r.id || `er-${i}`, isJunctionTable: false, label: '', ...r }));

    return {
      entities: parsed.entities || [],
      relationships: parsed.relationships || [],
      erOverview: parsed.erOverview || '',
      databaseDesignDecisions: parsed.databaseDesignDecisions || '',
    };
  } catch (err) {
    console.error('[geminiService] ER diagram generation failed, using fallback:', err.message);
    return buildFallbackERDiagram({ domainAnalysis });
  }
}

// Deterministic fallback: a minimal generic two-entity schema, used only
// when Gemini is unavailable or the call fails.
function buildFallbackERDiagram({ domainAnalysis } = {}) {
  const roleName = domainAnalysis?.userRoles?.[0] || 'User';
  const entities = [
    {
      id: 'user',
      name: roleName,
      position: { x: 40, y: 120 },
      purpose: `Represents a ${roleName.toLowerCase()} account in the system.`,
      attributes: [
        { name: 'id', type: 'UUID', description: 'Primary identifier', required: true, isPrimaryKey: true, isForeignKey: false, unique: true },
        { name: 'name', type: 'String', description: 'Full name', required: true, isPrimaryKey: false, isForeignKey: false, unique: false },
        { name: 'email', type: 'String', description: 'Unique email address', required: true, isPrimaryKey: false, isForeignKey: false, unique: true },
        { name: 'createdAt', type: 'Timestamp', description: 'Account creation time', required: true, isPrimaryKey: false, isForeignKey: false, unique: false },
      ],
    },
    {
      id: 'record',
      name: 'Record',
      position: { x: 400, y: 120 },
      purpose: 'Represents the primary domain object this application manages.',
      attributes: [
        { name: 'id', type: 'UUID', description: 'Primary identifier', required: true, isPrimaryKey: true, isForeignKey: false, unique: true },
        { name: 'ownerId', type: 'UUID', description: `Reference to the owning ${roleName.toLowerCase()}`, required: true, isPrimaryKey: false, isForeignKey: true, foreignKeyRef: 'user', unique: false },
        { name: 'status', type: 'Enum', description: 'Current lifecycle status', required: true, isPrimaryKey: false, isForeignKey: false, unique: false },
        { name: 'createdAt', type: 'Timestamp', description: 'Creation time', required: true, isPrimaryKey: false, isForeignKey: false, unique: false },
      ],
    },
  ];
  const relationships = [
    { id: 'er-1', source: 'user', target: 'record', cardinality: '1:N', label: 'owns', description: `Each ${roleName.toLowerCase()} can own many records, but each record belongs to exactly one ${roleName.toLowerCase()}.`, isJunctionTable: false },
  ];

  return {
    entities,
    relationships,
    erOverview: `The schema centers on [[user]] and [[record]]. Each [[user]] can own many [[record]] entries, tracked via a foreign key on [[record]] pointing back to its owner. This is a minimal placeholder schema — connect a Gemini API key for a schema genuinely designed around this project's actual domain.`,
    databaseDesignDecisions: `Referential integrity is maintained via the foreign key on [[record]]. As this schema evolves, consider adding soft deletes and an audit log table to track changes to [[record]] over time.`,
  };
}

module.exports = { generateDiagramFromPrompt, generateUserFlow, generateERDiagram };