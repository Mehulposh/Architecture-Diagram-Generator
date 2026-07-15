const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildFallbackDiagram } = require('../utils/diagramTemplates');

const SYSTEM_PROMPT = `You are an expert software architect. Given a natural language description of an
application, produce a JSON architecture diagram. Respond with ONLY valid JSON (no markdown fences, no
preamble) matching exactly this shape:

{
  "architectureStyle": "monolithic" | "microservices" | "event-driven" | "serverless" | "layered",
  "nodes": [
    {
      "id": "string, unique, kebab-case",
      "type": "frontend" | "backend" | "database" | "cache" | "queue" | "api-gateway" | "load-balancer" | "cloud" | "external",
      "position": { "x": number, "y": number },
      "data": { "label": "string", "description": "string" }
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

Rules:
- Lay nodes out left-to-right by data flow, spacing x by ~260 and y by ~140 so the diagram doesn't overlap.
- Identify a load balancer / API gateway, relevant backend services, caches, queues and databases where appropriate for the described scale.
- Flag single points of failure implicitly by adding redundancy notes in "documentation.deploymentGuidelines" rather than as separate fields.
- Keep the node count between 6 and 16 for readability.`;

let cachedClient = null;
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') return null;

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(apiKey);
  }

  return cachedClient.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });
}

async function generateDiagramFromPrompt({ prompt, architectureStyle, diagramLevel }) {
  const model = getModel();

  if (!model) {
    // No key configured: fall back to a deterministic template so the app
    // remains usable in local/dev environments without Gemini access.
    return buildFallbackDiagram({ prompt, architectureStyle });
  }

  try {
    const userMessage = `Application description: ${prompt}\nPreferred architecture style: ${architectureStyle || 'let the AI decide'}\nDiagram level requested: ${diagramLevel || 'high-level'}`;

    const result = await model.generateContent(userMessage);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```json/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Normalize edges to always carry an id.
    parsed.edges = (parsed.edges || []).map((e, i) => ({ id: e.id || `e-${i}`, animated: false, label: '', ...e }));
    return parsed;
  } catch (err) {
    console.error('[geminiService] generation failed, using fallback:', err.message);
    return buildFallbackDiagram({ prompt, architectureStyle });
  }
}

module.exports = { generateDiagramFromPrompt };