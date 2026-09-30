class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
module.exports = (status, message, details) => new HttpError(status, message, details);
module.exports.HttpError = HttpError;
