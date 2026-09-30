const { HttpError } = require('../utils/httpError');

module.exports = (error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: Object.values(error.errors)[0]?.message || 'Validation failed' });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'That already exists.' });
  }
  const status = error instanceof HttpError ? error.status : (error.status || 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ success: false, message: error.message || 'Server error' });
};
