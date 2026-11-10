const HttpError = require('./httpError');

// Replaces the getIpAddress() helper that was copy-pasted into each controller.
const getClientInfo = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

/** Parse a positive-integer route param, or throw 400 (instead of a pg 500). */
const parseId = (value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid id.');
  return id;
};

module.exports = { getClientInfo, parseId };