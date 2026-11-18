import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../../ui/Bottomsheet';
import { syncNotifications } from './UseNotifications';

const API = process.env.REACT_APP_API_URL;
const readToken = () => sessionStorage.getItem('token') || localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${readToken()}` });

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationPanel({ open, onClose, unreadCount = 0 }) {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const prevCountRef = useRef(unreadCount);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Loads a page. No cursor = first page. `silent` refreshes in the background
   * (no spinner, no error banner), used when a new notification arrives.
   */
  const fetchPage = useCallback(async (cursor = null, { silent = false } = {}) => {
    if (!silent) {
      setError(null);
      if (cursor) setLoadingMore(true);
      else setLoading(true);
    }
    try {
      const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
      const res = await fetch(`${API}/notifications${qs}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');

      setItems((prev) => {
        if (!cursor) return data.items;
        const seen = new Set(prev.map((i) => i.notification_id));
        return [...prev, ...data.items.filter((i) => !seen.has(i.notification_id))];
      });
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (!silent) setError('Could not load notifications.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch whenever the panel opens
  useEffect(() => {
    if (open) fetchPage(null);
  }, [open, fetchPage]);

  // A new notification arrived while the panel is open: refresh quietly.
  useEffect(() => {
    if (open && unreadCount > prevCountRef.current) fetchPage(null, { silent: true });
    prevCountRef.current = unreadCount;
  }, [unreadCount, open, fetchPage]);

  // Escape closes the desktop dropdown (the mobile sheet handles its own).
  useEffect(() => {
    if (!open || isMobile) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isMobile, onClose]);

  const markLocalRead = (ids) => {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((i) => (ids === 'all' ? (i.read_at ? i : { ...i, read_at: now })
        : i.notification_id === ids ? { ...i, read_at: now } : i))
    );
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch(`${API}/notifications/read-all`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) return;
      markLocalRead('all');
      syncNotifications();
    } catch {
      // leave the list as it is; nothing was marked
    }
  };

  const handleItemClick = async (item) => {
    if (!item.read_at) {
      try {
        const res = await fetch(`${API}/notifications/${item.notification_id}/read`, {
          method: 'POST',
          headers: authHeaders(),
        });
        if (res.ok) {
          markLocalRead(item.notification_id);
          syncNotifications();
        }
      } catch {
        // still navigate below
      }
    }
    if (item.link) {
      onClose();
      navigate(item.link);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-semibold text-ink">Notifications</h3>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-xs text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
        >
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-ink-2">Loading...</div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-danger">
            {error}{' '}
            <button type="button" onClick={() => fetchPage(null)} className="underline">
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-ink-2">No notifications yet.</div>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.notification_id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`block w-full p-4 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none ${!item.read_at ? 'bg-brand/5' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm text-ink ${!item.read_at ? 'font-semibold' : 'font-medium'}`}>{item.title}</p>
                      <span className="text-[10px] text-ink-3 whitespace-nowrap">{timeAgo(item.created_at)}</span>
                    </div>
                    {item.body && <p className="mt-1 text-xs text-ink-2 line-clamp-2">{item.body}</p>}
                  </button>
                </li>
              ))}
            </ul>
            {nextCursor && (
              <div className="p-3 text-center">
                <button
                  type="button"
                  onClick={() => fetchPage(nextCursor)}
                  disabled={loadingMore}
                  className="text-xs text-brand hover:underline disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load older'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title="Notifications">
        <div className="h-[60vh]">{content}</div>
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div className="absolute right-0 top-12 z-[250] w-80 rounded-xl bg-surface shadow-lg border border-line">
      <div className="h-96 flex flex-col">{content}</div>
    </div>
  );
}