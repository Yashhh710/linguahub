const jwt = require('jsonwebtoken');
const { env } = require('./config/env');

// Each socket joins a private room `user:<id>` once authenticated, so server code can target
// realtime events (XP updates, friend requests, notifications) at exactly one learner's open tabs.
module.exports = function attachSockets(io) {
  io.on('connection', socket => {
    socket.on('authenticate', token => {
      try {
        const payload = jwt.verify(token, env.jwtSecret);
        socket.join(`user:${payload.id}`);
        socket.emit('authenticated', { ok: true });
      } catch {
        socket.emit('authenticated', { ok: false });
      }
    });
  });
};
