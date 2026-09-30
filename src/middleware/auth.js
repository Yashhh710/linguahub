const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const fail = require('../utils/httpError');

/** Requires a valid Bearer token; attaches { id, role } to req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(fail(401, 'Sign in required.'));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(fail(401, 'Your session has expired. Please sign in again.'));
  }
}

/** Attaches req.user if a valid token is present, but never rejects the request. */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try { req.user = jwt.verify(token, env.jwtSecret); } catch { /* ignore invalid token */ }
  next();
}

const requireRole = (...roles) => (req, res, next) =>
  !req.user || !roles.includes(req.user.role)
    ? next(fail(403, 'You do not have permission to do that.'))
    : next();

module.exports = { requireAuth, optionalAuth, requireRole };
