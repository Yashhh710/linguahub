const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

const issueUserToken = user => jwt.sign(
  { id: String(user._id), role: user.role, name: user.name },
  env.jwtSecret,
  { expiresIn: env.jwtExpiresIn }
);

module.exports = { issueUserToken };
