/**
 * Profile photo service: validates, resizes and stores photos, and imports the
 * Google profile photo on first Google sign-in.
 *
 * Every image, whether uploaded or from Google, goes through the same pipeline:
 * decode -> check it really is PNG/JPEG/WebP -> fix rotation -> center-crop to a
 * 256x256 square -> re-encode as WebP. Re-encoding drops all metadata (EXIF/GPS)
 * and anything unusual in the original file.
 *
 * Requires Node 18+ (global fetch, AbortSignal.timeout) and the `sharp` package.
 */
const sharp = require('sharp');
const AvatarModel = require('../models/avatarModel');

const AVATAR_SIZE = 256; // px; sharp on screens up to 2x density at a 128px display size
const MAX_UPLOAD_BYTES = 1024 * 1024; // decoded image size accepted from the browser
const MAX_GOOGLE_BYTES = 2 * 1024 * 1024;
const MAX_PIXELS = 25_000_000; // blocks decompression bombs (about 5000 x 5000)
const FETCH_TIMEOUT_MS = 5000;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp']);

// Only these data URIs are accepted; the real format is verified again from the bytes.
const DATA_URI = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
// Google serves profile photos only from *.googleusercontent.com.
const GOOGLE_PHOTO_HOST = /(^|\.)googleusercontent\.com$/;

/** An error that is safe to show to the user, with the HTTP status to send. */
class AvatarError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AvatarError';
    this.status = status;
  }
}

/**
 * Decodes a browser-supplied data URI into raw image bytes.
 * @param {unknown} dataUri e.g. "data:image/webp;base64,AAAA..."
 * @returns {Buffer}
 * @throws {AvatarError} when the value is not a supported image data URI or is too large.
 */
function decodeDataUri(dataUri) {
  // Base64 inflates size by about a third; reject oversize strings before running the regex.
  const maxChars = Math.ceil((MAX_UPLOAD_BYTES * 4) / 3) + 64;
  if (typeof dataUri === 'string' && dataUri.length > maxChars) {
    throw new AvatarError('Image is too large. Please choose a smaller photo.', 413);
  }
  const match = typeof dataUri === 'string' ? DATA_URI.exec(dataUri) : null;
  if (!match) throw new AvatarError('Please choose a PNG, JPEG or WebP image.');

  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new AvatarError('Image is too large. Please choose a smaller photo.', 413);
  }
  return buffer;
}

/**
 * Converts any supported image into the standard avatar: 256x256 WebP, no metadata.
 * @param {Buffer} buffer
 * @returns {Promise<Buffer>}
 * @throws {AvatarError} when the bytes are not a valid PNG/JPEG/WebP image.
 */
async function processImage(buffer) {
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_PIXELS });
    const { format } = await image.metadata();
    if (!ALLOWED_FORMATS.has(format)) {
      throw new AvatarError('Please choose a PNG, JPEG or WebP image.');
    }
    return await image
      .rotate() // apply EXIF orientation before the metadata is dropped
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (err) {
    if (err instanceof AvatarError) throw err;
    throw new AvatarError('That file could not be read as an image.');
  }
}

/**
 * Validates, processes and stores a photo chosen by the user.
 * @param {number} userId
 * @param {unknown} dataUri
 * @returns {Promise<string>} The new public avatar path.
 */
async function saveUpload(userId, dataUri) {
  const webp = await processImage(decodeDataUri(dataUri));
  return AvatarModel.save(userId, webp, 'upload');
}

/**
 * Validates a Google photo URL and asks Google for the 256px size.
 * @param {string} pictureUrl `picture` field from Google's userinfo response.
 * @returns {string|null} The sized https URL, or null if it is not a Google photo URL.
 */
function toGooglePhotoUrl(pictureUrl) {
  try {
    // Google's default is =s96-c (tiny); ask for the size we actually store.
    const sized = String(pictureUrl).replace(/=s\d+(-c)?$/, `=s${AVATAR_SIZE}-c`);
    const url = new URL(sized);
    if (url.protocol !== 'https:' || !GOOGLE_PHOTO_HOST.test(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Reads the signed-in user's photo URL from Google, using the access token from sign-in. */
async function getGooglePictureUrl(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const { picture } = await res.json();
  return picture || null;
}

/** Downloads a Google photo, refusing anything that is not a Google-hosted image. */
async function downloadGooglePhoto(pictureUrl) {
  const safeUrl = toGooglePhotoUrl(pictureUrl);
  if (!safeUrl) throw new Error('Refusing to fetch a non-Google photo URL.');

  const res = await fetch(safeUrl, { redirect: 'error', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Google photo request failed (${res.status}).`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_GOOGLE_BYTES) throw new Error('Google photo is unexpectedly large.');
  return buffer;
}

/**
 * Imports the Google profile photo for a user, but only if they have never had a
 * photo or removed one. Best effort: a failure here must never block sign-in.
 * @param {number} userId
 * @param {string} accessToken Google access token from this sign-in.
 */
async function importGooglePhoto(userId, accessToken) {
  try {
    if (await AvatarModel.hasRow(userId)) return;
    const pictureUrl = await getGooglePictureUrl(accessToken);
    if (!pictureUrl) return;
    const webp = await processImage(await downloadGooglePhoto(pictureUrl));
    await AvatarModel.saveIfAbsent(userId, webp, 'google');
  } catch (err) {
    console.error('Google photo import skipped:', err.message);
  }
}

module.exports = {
  AvatarError,
  decodeDataUri,
  processImage,
  saveUpload,
  toGooglePhotoUrl,
  importGooglePhoto,
};