import { useEffect, useState } from 'react';

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

// --- Shared polling -------------------------------------------------------
// One timer for the whole app, however many bells are mounted. It starts when
// the first bell mounts and stops when the last one unmounts. (Before, every
// bell reset a single module-level timer, so unmounting one bell, e.g. the
// mobile header, silently stopped polling for the other.)
let pollTimer = null;
let subscribers = 0;

function refreshIfVisible() {
  if (document.visibilityState === 'visible') syncNotifications();
}

function startPolling() {
  syncNotifications();
  pollTimer = setInterval(refreshIfVisible, POLL_INTERVAL);
  window.addEventListener('focus', refreshIfVisible);
  document.addEventListener('visibilitychange', refreshIfVisible);
}

function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
  window.removeEventListener('focus', refreshIfVisible);
  document.removeEventListener('visibilitychange', refreshIfVisible);
}

export default function useNotifications() {
  const [count, setCount] = useState(readCachedCount);

  // Listen for local updates (e.g. from markRead)
  useEffect(() => {
    const sync = () => setCount(readCachedCount());
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!readToken()) return undefined;
    subscribers += 1;
    if (subscribers === 1) startPolling();
    return () => {
      subscribers -= 1;
      if (subscribers === 0) stopPolling();
    };
  }, []);

  return { count };
}