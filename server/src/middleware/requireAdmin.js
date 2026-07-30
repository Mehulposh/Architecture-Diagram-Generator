const User = require('../models/user');

/**
 * Ensures the authenticated user has administrative privileges.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {Promise<void>}
 */
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('isAdmin');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Could not verify admin access.' });
  }
}

module.exports = requireAdmin;