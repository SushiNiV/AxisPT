import { useCallback, useEffect, useState } from 'react';

/**
 * Single source of truth for the signed-in user's profile photo.
 *
 * Login stores the photo path (e.g. "/avatars/<key>?v=123") in sessionStorage under
 * `avatarUrl`. Every component that shows the photo uses this hook, and anything that
 * changes the photo calls `setAvatarPath`, which updates storage and notifies all of
 * them at once (same pattern as the `axispt:open-assistant` event).
 */

const STORAGE_KEY = 'avatarUrl';
const CHANGE_EVENT = 'axispt:avatar-changed';

const readPath = () => sessionStorage.getItem(STORAGE_KEY) || null;

/** Turns a server path into a full image URL. REACT_APP_API_URL already ends in /api. */
export const toAvatarSrc = (path) => (path ? `${process.env.REACT_APP_API_URL}${path}` : null);

/**
 * Saves a new photo path (or null to clear it) and tells every mounted avatar to update.
 * @param {string|null} path
 */
export function setAvatarPath(path) {
  if (path) sessionStorage.setItem(STORAGE_KEY, path);
  else sessionStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
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

  // Remember which path failed; a new upload has a new path, so it is tried again.
  const onError = useCallback(() => setFailedPath(path), [path]);

  return {
    src: path && path !== failedPath ? toAvatarSrc(path) : null,
    onError,
    setAvatarPath,
  };
}