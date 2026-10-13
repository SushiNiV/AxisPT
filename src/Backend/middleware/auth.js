const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Gate a route by role. Roles in the JWT are 'admin' | 'faculty' | 'student'.
 * Usage: requireRole('admin')  or  requireRole('admin', 'faculty')
 */
const requireRole = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const role = req.user.role;
    if (!allowed.includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};

/**
 * Gate a route by designation (finer-grained than role).
 * Designation strings come from the `designations` table via the JWT payload
 * (`req.user.designation`). Unused today — reserved for the client's
 * fine-grained pass. Usage: requireDesignation('Dean', 'Program Head')
 */
const requireDesignation = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    const designation = req.user.designation;
    if (!designation || !allowed.includes(designation)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole, requireDesignation };