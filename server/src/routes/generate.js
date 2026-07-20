const express = require('express');
const requireAuth = require('../middleware/auth');
const { generateDiagramFromPrompt, generateUserFlow } = require('../services/geminiService');
const { STATIC_TEMPLATES } = require('../utils/diagramTemplates');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { prompt, architectureStyle, diagramLevel } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'A text prompt describing the application is required.' });
  }

  try {
    const diagram = await generateDiagramFromPrompt({ prompt, architectureStyle, diagramLevel });
    res.json(diagram);
  } catch (err) {
    res.status(500).json({ error: 'Diagram generation failed.', details: err.message });
  }
});

// Generates the user flow artifact. Expects the domainAnalysis already
// produced by the architecture generation call above, so this reuses the
// same roles/terminology instead of re-classifying the project from
// scratch (which would risk drifting from the architecture diagram and
// cost an extra domain-analysis call).
router.post('/user-flow', requireAuth, async (req, res) => {
  const { prompt, domainAnalysis } = req.body;
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'A text prompt describing the application is required.' });
  }
  if (!domainAnalysis || !domainAnalysis.userRoles?.length) {
    return res.status(400).json({ error: 'Generate the architecture diagram first so user roles are known.' });
  }

  try {
    const flow = await generateUserFlow({ prompt, domainAnalysis });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: 'User flow generation failed.', details: err.message });
  }
});

router.get('/templates', requireAuth, (req, res) => {
  res.json(STATIC_TEMPLATES);
});

// Lightweight heuristic reviewer: flags common architecture gaps.
// This runs independently of the Gemini call so it always returns instantly,
// even for diagrams the user has hand-edited in the canvas.
router.post('/suggestions', requireAuth, (req, res) => {
  const { nodes = [], edges = [] } = req.body;
  const types = new Set(nodes.map((n) => n.type));
  const suggestions = [];

  if (!types.has('cache')) {
    suggestions.push({ severity: 'medium', message: 'No caching layer detected. Consider adding Redis in front of frequently-read services to reduce database load.' });
  }
  if (!types.has('api-gateway') && !types.has('load-balancer')) {
    suggestions.push({ severity: 'high', message: 'No API gateway or load balancer found. A single entry point improves security and lets you scale backend instances horizontally.' });
  }
  if (!types.has('queue') && nodes.filter((n) => n.type === 'backend').length > 2) {
    suggestions.push({ severity: 'low', message: 'Multiple backend services with no message queue. Consider event-driven communication to decouple services.' });
  }

  const dbNodes = nodes.filter((n) => n.type === 'database');
  dbNodes.forEach((db) => {
    const incoming = edges.filter((e) => e.target === db.id);
    if (incoming.length > 3) {
      suggestions.push({ severity: 'high', message: `"${db.data?.label || db.id}" is written to by ${incoming.length} services directly. This is a potential single point of failure — consider a dedicated data service or read replicas.` });
    }
  });

  if (suggestions.length === 0) {
    suggestions.push({ severity: 'info', message: 'No obvious scalability gaps detected. Nice work!' });
  }

  res.json({ suggestions });
});

module.exports = router;