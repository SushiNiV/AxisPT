/**
 * Throw this from controllers/services to send a specific status + message.
 * Express 5 forwards rejected promises to the global error handler in Server.js,
 * which turns it into { success: false, message }.
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

module.exports = HttpError;