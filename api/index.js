const createApp = require('../src/app');
const connectDB = require('../src/config/db');
const { assertConfig } = require('../src/config/env');

const app = createApp();
let ready;

module.exports = async (req, res) => {
  try {
    assertConfig();
    ready = ready || connectDB();
    await ready;
  } catch (error) {
    ready = null;
    return res.status(500).json({ success: false, message: error.message });
  }
  return app(req, res);
};
