import { useCallback, useEffect, useState } from 'react';

/**
 * Single source of truth for the signed-in user's profile photo.
 *
 * The server is the real owner of the photo. sessionStorage (`avatarUrl`) is only a
 * cache so the header can show it instantly. Once per sign-in, `syncAvatar` asks the
 * server for the current photo and refreshes that cache, so the photo survives
 * logout/login, whichever sign-in method was used, and stays right when it was changed
 * from another device.
 *
 * Anything that changes the photo calls `setAvatarPath`, which updates the cache and
 * notifies every mounted avatar at once (same pattern as `axispt:open-assistant`).
 */

const STORAGE_KEY = 'avatarUrl';
const CHANGE_EVENT = 'axispt:avatar-changed';

const readPath = () => sessionStorage.getItem(STORAGE_KEY) || null;
const readToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

/** Turns a server path into a full image URL. REACT_APP_API_URL already ends in /api. */
export const toAvatarSrc = (path) => (path ? `${process.env.REACT_APP_API_URL}${path}` : null);

/** Saves a new photo path (or null to clear it) and tells every mounted avatar to update. */
export function setAvatarPath(path) {
  if (path) sessionStorage.setItem(STORAGE_KEY, path);
  else sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let syncedToken = null; // the sign-in (token) we already synced for
let inflight = null; // shared by every component that asks at the same moment

/**
 * Fetches the current photo from the server and refreshes the cache.
 * Runs once per sign-in; concurrent callers share one request. On any failure the cached
 * photo is left alone (a network blip must never wipe a good photo) and the next call retries.
 */
export function syncAvatar() {
  const token = readToken();
  if (!token) return Promise.resolve();
  if (token === syncedToken) return inflight || Promise.resolve();

  syncedToken = token;
  inflight = fetch(`${process.env.REACT_APP_API_URL}/avatars/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      const body = res.ok ? await res.json() : null;
      if (!body || !body.success) {
        syncedToken = null; // try again on the next mount
        return;
      }
      const fresh = body.avatarUrl || null;
      if (fresh !== readPath()) setAvatarPath(fresh);
    })
    .catch(() => {
      syncedToken = null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * @returns {{ src: string|null, onError: () => void, setAvatarPath: (p: string|null) => void }}
 *   `src` is null when there is no photo or it failed to load, so callers can fall back
 *   to initials. Pass `onError` to the <img> so a broken image falls back automatically.
 */
export default function useAvatar() {
  const [path, setPath] = useState(readPath);
  const [failedPath, setFailedPath] = useState(null);

  useEffect(() => {
    const sync = () => setPath(readPath());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  // Make sure the cache matches the server (once per sign-in).
  useEffect(() => {
    syncAvatar();
  }, []);

  // Remember which path failed; a new upload has a new path, so it is tried again.
  const onError = useCallback(() => setFailedPath(path), [path]);

  return {
    src: path && path !== failedPath ? toAvatarSrc(path) : null,
    onError,
    setAvatarPath,
  };
}