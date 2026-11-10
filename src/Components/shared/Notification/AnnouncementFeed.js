import React, { useEffect, useState } from 'react';
import Card, { CardEmpty } from '../../ui/Card'; // Adjust path
import Badge from '../../ui/Badge'; // Adjust path
import { BiMegaphone } from 'react-icons/bi';

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    fetch(`${process.env.REACT_APP_API_URL}/notifications/announcements?programId=`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnnouncements(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card title="Announcements" scroll className="h-full">
      {loading ? (
        <CardEmpty>Loading announcements...</CardEmpty>
      ) : announcements.length === 0 ? (
        <CardEmpty>No active announcements.</CardEmpty>
      ) : (
        <div className="space-y-4 pr-1">
          {announcements.map((a) => (
            <div key={a.announcement_id} className="rounded-xl border !border-line bg-surface-2 p-4">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-semibold text-brand-ink">{a.title}</h3>
                <span className="text-xs text-ink-3 whitespace-nowrap mt-1">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink whitespace-pre-wrap">{a.body}</p>
              
              {a.audience !== 'all' && (
                <div className="mt-3">
                  <Badge tone="neutral">
                    {a.audience === 'students' ? 'Students Only' : 'Faculty Only'}
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}