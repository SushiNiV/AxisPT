/**
 * HTTP handlers for profile photos.
 *
 *   POST   /avatars/me     upload or replace the signed-in user's photo (JWT)
 *   DELETE /avatars/me     remove it (JWT)
 *   GET    /avatars/:key   serve the image bytes (public; the key is unguessable)
 *
 * The user always comes from the verified JWT (`req.user.id`), never from the request.
 */
const AvatarModel = require('../models/avatarModel');
const AvatarService = require('../services/avatarService');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Per-user limit on photo changes, to protect the database from abuse.
// In memory, so it is per server instance and resets on restart (fine for one Render instance).
const CHANGES_PER_HOUR = 10;
const ONE_HOUR_MS = 60 * 60 * 1000;
const recentChanges = new Map();

/** @returns {boolean} true if this user may change their photo now (and records the attempt). */
function allowChange(userId, now = Date.now()) {
  const recent = (recentChanges.get(userId) || []).filter((t) => t > now - ONE_HOUR_MS);
  const allowed = recent.length < CHANGES_PER_HOUR;
  if (allowed) recent.push(now);
  recentChanges.set(userId, recent);
  return allowed;
}

/** Sends user-safe errors as-is and hides everything else behind a generic 500. */
function sendError(res, err, logLabel) {
  if (err instanceof AvatarService.AvatarError) {
    return res.status(err.status).json({ success: false, message: err.message });
  }
  console.error(`${logLabel}:`, err);
  return res.status(500).json({ success: false, message: 'Internal Server Error' });
}

exports.upload = async (req, res) => {
  const userId = req.user.id;
  if (!allowChange(userId)) {
    return res.status(429).json({ success: false, message: 'Too many photo changes. Please try again later.' });
  }
  try {
    const avatarUrl = await AvatarService.saveUpload(userId, req.body && req.body.image);
    res.json({ success: true, avatarUrl });
  } catch (err) {
    sendError(res, err, 'Avatar upload failed');
  }
};

exports.remove = async (req, res) => {
  const userId = req.user.id;
  if (!allowChange(userId)) {
    return res.status(429).json({ success: false, message: 'Too many photo changes. Please try again later.' });
  }
  try {
    await AvatarModel.clear(userId);
    res.json({ success: true, avatarUrl: null });
  } catch (err) {
    sendError(res, err, 'Avatar removal failed');
  }
};

exports.serve = async (req, res) => {
  const { key } = req.params;
  if (!UUID.test(key)) return res.status(404).end();

  try {
    const row = await AvatarModel.findByKey(key);
    if (!row) return res.status(404).end();

    // URLs with ?v=<version> change whenever the photo does, so they can be cached for a year.
    // A bare URL gets a short cache so a stale copy cannot stick around.
    const versioned = typeof req.query.v === 'string' && req.query.v.length > 0;
    res.set({
      'Content-Type': row.content_type,
      'Cache-Control': versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=300',
      // The frontend is on a different origin than the API; without this a
      // same-origin policy (e.g. helmet's default) would block the <img>.
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff',
    });
    res.send(row.image);
  } catch (err) {
    console.error('Avatar serve failed:', err);
    res.status(500).end();
  }
};