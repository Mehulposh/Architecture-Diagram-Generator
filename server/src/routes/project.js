const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const Project = require('../models/project');
const User = require('../models/user');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const projects = await Project.find({
    $or: [{ owner: req.userId }, { collaborators: req.userId }],
  })
    .select('name architectureStyle diagramLevel updatedAt createdAt')
    .sort({ updatedAt: -1 });
  res.json(projects);
});

router.post('/', requireAuth, async (req, res) => {
  const { name, prompt, architectureStyle, diagramLevel, nodes, edges, techStack, documentation } = req.body;
  const project = await Project.create({
    owner: req.userId,
    name: name || 'Untitled architecture',
    prompt,
    architectureStyle,
    diagramLevel,
    nodes,
    edges,
    techStack,
    documentation,
    versions: [{ label: 'Initial version', nodes, edges }],
  });
  res.status(201).json(project);
});

router.get('/:id', requireAuth, async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    $or: [{ owner: req.userId }, { collaborators: req.userId }],
  })
    .populate('owner', 'name email')
    .populate('collaborators', 'name email');
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
});

router.put('/:id', requireAuth, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const { nodes, edges, techStack, documentation, name, architectureStyle, saveVersion, versionLabel } = req.body;

  if (name !== undefined) project.name = name;
  if (architectureStyle !== undefined) project.architectureStyle = architectureStyle;
  if (nodes !== undefined) project.nodes = nodes;
  if (edges !== undefined) project.edges = edges;
  if (techStack !== undefined) project.techStack = techStack;
  if (documentation !== undefined) project.documentation = documentation;

  if (saveVersion) {
    project.versions.push({ label: versionLabel || `Version ${project.versions.length + 1}`, nodes: project.nodes, edges: project.edges });
  }

  await project.save();
  res.json(project);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const result = await Project.deleteOne({ _id: req.params.id, owner: req.userId });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Project not found.' });
  res.status(204).send();
});

router.post('/:id/share', requireAuth, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  project.isPublic = true;
  project.shareToken = project.shareToken || crypto.randomBytes(12).toString('hex');
  await project.save();
  res.json({ shareToken: project.shareToken });
});

router.get('/public/:shareToken', async (req, res) => {
  const project = await Project.findOne({ shareToken: req.params.shareToken, isPublic: true });
  if (!project) return res.status(404).json({ error: 'This shared diagram is not available.' });
  res.json(project);
});

router.get('/:id/versions', requireAuth, async (req, res) => {
  const project = await Project.findOne({
    _id: req.params.id,
    $or: [{ owner: req.userId }, { collaborators: req.userId }],
  }).select('versions');
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project.versions);
});

router.post('/:id/versions/:index/restore', requireAuth, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const version = project.versions[req.params.index];
  if (!version) return res.status(404).json({ error: 'Version not found.' });

  project.nodes = version.nodes;
  project.edges = version.edges;
  await project.save();
  res.json(project);
});

router.post('/:id/collaborators', requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'An email address is required.' });
  }

  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found, or you are not its owner.' });

  const collaborator = await User.findOne({ email: email.toLowerCase().trim() });
  if (!collaborator) {
    return res.status(404).json({ error: 'No account exists with that email address.' });
  }
  if (collaborator._id.equals(project.owner)) {
    return res.status(400).json({ error: 'That user already owns this project.' });
  }
  if (project.collaborators.some((id) => id.equals(collaborator._id))) {
    return res.status(409).json({ error: 'That user is already a collaborator.' });
  }

  project.collaborators.push(collaborator._id);
  await project.save();
  await project.populate('collaborators', 'name email');
  res.status(201).json({ collaborators: project.collaborators });
});

router.delete('/:id/collaborators/:userId', requireAuth, async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: 'Project not found, or you are not its owner.' });

  project.collaborators = project.collaborators.filter((id) => id.toString() !== req.params.userId);
  await project.save();
  await project.populate('collaborators', 'name email');
  res.json({ collaborators: project.collaborators });
});

module.exports = router;