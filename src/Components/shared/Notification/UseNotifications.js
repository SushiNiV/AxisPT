import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'unreadCount';
const CHANGE_EVENT = 'axispt:notifications-changed';
const POLL_INTERVAL = 45000; // 45 seconds

const readCachedCount = () => parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
const readToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');

/** Updates the cache and tells every mounted bell to update instantly. */
export function setUnreadCount(count) {
  sessionStorage.setItem(STORAGE_KEY, count.toString());
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

let syncedToken = null;
let pollTimer = null;

export function syncNotifications() {
  const token = readToken();
  if (!token) return Promise.resolve();

  return fetch(`${process.env.REACT_APP_API_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Fetch failed');
      const body = await res.json();
      if (body.success) setUnreadCount(body.count);
    })
    .catch(() => {
      // silently fail, try again on next poll
    });
}

export default function useNotifications() {
  const [count, setCount] = useState(readCachedCount);

  // Listen for local updates (e.g. from markRead)
  useEffect(() => {
    const sync = () => setCount(readCachedCount());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  // Initial fetch + Setup polling
  useEffect(() => {
    const token = readToken();
    if (!token) return undefined;

    // 1. Fetch immediately on mount
    syncNotifications();

    // 2. Setup polling (paused when tab is hidden)
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncNotifications();
      }
    }, POLL_INTERVAL);

    // 3. Refresh on focus/visibility change
    const onFocus = () => {
      if (document.visibilityState === 'visible') syncNotifications();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  return { count };
}