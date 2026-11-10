const jwt = require('jsonwebtoken');

// Fail fast at startup instead of returning confusing 403s on every request.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Check your .env file.');
}

const deny = (res, status, message) =>
  res.status(status).json({ success: false, message });

const getToken = (req) =>
  req.header('x-auth-token') ||
  req.header('Authorization')?.replace(/^Bearer\s+/i, '');

const verifyToken = (req, res, next) => {
  const token = getToken(req);
  if (!token) return deny(res, 401, 'Access denied. No token provided.');

  try {
    // Pin the algorithm so a token can't pick a different one.
    // jsonwebtoken signs with HS256 by default, so this matches existing tokens.
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch (err) {
    return deny(res, 403, 'Invalid or expired token.');
  }
};

/**
 * Gate a route by role. Roles in the JWT are 'admin' | 'faculty' | 'student'.
 * Usage: requireRole('admin')  or  requireRole('admin', 'faculty')
 */
const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return deny(res, 401, 'Not authenticated.');
  if (!allowed.includes(req.user.role)) return deny(res, 403, 'Access denied.');
  next();
};

/**
 * Gate a route by designation (finer-grained than role), read from
 * `req.user.designation`. Currently unused.
 * Usage: requireDesignation('Dean', 'Program Head')
 */
const requireDesignation = (...allowed) => (req, res, next) => {
  if (!req.user) return deny(res, 401, 'Not authenticated.');
  const { designation } = req.user;
  if (!designation || !allowed.includes(designation)) {
    return deny(res, 403, 'Access denied.');
  }
  next();
};

module.exports = { verifyToken, requireRole, requireDesignation };