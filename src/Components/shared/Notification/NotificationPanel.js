import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../../ui/Bottomsheet'; 
import { syncNotifications } from './UseNotifications';

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

export default function NotificationPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch whenever the panel opens
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  const handleMarkAllRead = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    await fetch(`${process.env.REACT_APP_API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    setItems(items.map(i => ({ ...i, read_at: new Date().toISOString() })));
    syncNotifications(); 
  };

  const handleItemClick = async (id, link, isRead) => {
    if (!isRead) {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_API_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(items.map(i => i.notification_id === id ? { ...i, read_at: new Date().toISOString() } : i));
      syncNotifications();
    }
    if (link) {
      onClose();
      navigate(link);
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="font-semibold text-ink">Notifications</h3>
        <button onClick={handleMarkAllRead} className="text-xs text-brand hover:underline">
          Mark all read
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-ink-2">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-center text-sm text-ink-2">No notifications yet.</div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li 
                key={item.notification_id} 
                onClick={() => handleItemClick(item.notification_id, item.link, !!item.read_at)}
                className={`p-4 cursor-pointer hover:bg-surface-2 transition-colors ${!item.read_at ? 'bg-brand/5' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <span className="text-[10px] text-ink-3 whitespace-nowrap">{timeAgo(item.created_at)}</span>
                </div>
                {item.body && <p className="mt-1 text-xs text-ink-2 line-clamp-2">{item.body}</p>}
              </li>
            ))}
          </ul>
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