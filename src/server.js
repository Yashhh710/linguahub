const http = require('http');
const { Server } = require('socket.io');
const { env, assertConfig } = require('./config/env');
const connectDB = require('./config/db');
const createApp = require('./app');
const attachSockets = require('./sockets');

async function main() {
  assertConfig();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: env.corsOrigins.length ? { origin: env.corsOrigins } : { origin: '*' } });
  app.set('io', io);
  attachSockets(io);

  await connectDB();
  server.listen(env.port, () => console.log(`LinguaHub API listening on port ${env.port} (${env.nodeEnv})`));

  const shutdown = signal => {
    console.log(`${signal} received, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
