const express = require('express');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/user');
const Project = require('../models/project');

/**
 * Router for administrator-only management endpoints.
 * @type {import('express').Router}
 */
const router = express.Router();
router.use(requireAuth, requireAdmin);

/**
 * Returns high-level statistics for administrative dashboards.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.get('/stats', async (req, res) => {
  const [userCount, projectCount] = await Promise.all([
    User.countDocuments(),
    Project.countDocuments(),
  ]);
  res.json({ userCount, projectCount });
});

/**
 * Lists all registered users.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.get('/users', async (req, res) => {
  const users = await User.find().select('name email isAdmin createdAt').sort({ createdAt: -1 });
  res.json(users);
});

/**
 * Deletes a user account and any projects owned by that user.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: "You can't delete your own account from here." });
  }
  const result = await User.deleteOne({ _id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found.' });
  await Project.deleteMany({ owner: req.params.id });
  res.status(204).send();
});

/**
 * Lists all projects in the system.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.get('/projects', async (req, res) => {
  const projects = await Project.find()
    .populate('owner', 'name email')
    .select('name architectureStyle owner updatedAt createdAt')
    .sort({ updatedAt: -1 });
  res.json(projects);
});

/**
 * Removes a project from the application.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<void>}
 */
router.delete('/projects/:id', async (req, res) => {
  const result = await Project.deleteOne({ _id: req.params.id });
  if (result.deletedCount === 0) return res.status(404).json({ error: 'Project not found.' });
  res.status(204).send();
});

module.exports = router;