const User = require('../models/user');

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