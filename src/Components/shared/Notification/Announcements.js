import React, { useEffect, useState, useCallback } from 'react';
import { BiBell, BiPlus } from 'react-icons/bi';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import AnnouncementForm from './AnnouncementForm'; // Make sure this path is correct

export default function Announcements({ isAdmin = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/notifications/announcements?programId=`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnnouncements(data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (a) => {
    if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/notifications/announcements/${a.announcement_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((item) => item.announcement_id !== a.announcement_id));
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  return (
    <>
      <Card
        title="Announcements"
        className="h-full"
        action={
          isAdmin ? (
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
              <BiPlus className="text-base" aria-hidden="true" /> Create
            </Button>
          ) : null
        }
      >
        <div className="h-full max-h-[26rem] overflow-y-auto pr-1 [scrollbar-width:none] lg:max-h-none [&::-webkit-scrollbar]:hidden">
          {announcements.length === 0 ? (
            <p className="flex h-full min-h-[8rem] items-center justify-center text-sm text-ink-3">
              No announcements yet.
            </p>
          ) : (
            <ul className="-my-1 divide-y divide-line">
              {announcements.map((a) => (
                <li key={a.announcement_id} className="py-4">
                  <div className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink"
                    >
                      <BiBell className="text-sm" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-ink">{a.title}</p>
                        <span className="shrink-0 text-xs tabular-nums text-ink-3">
                          {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2 whitespace-pre-wrap">{a.body}</p>

                      {isAdmin && (
                        <div className="mt-2.5 flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => handleDelete(a)} 
                            className="text-xs font-medium text-danger hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Only mount the modal if admin */}
      {isAdmin && (
        <AnnouncementForm 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAnnouncements();
          }} 
        />
      )}
    </>
  );
}