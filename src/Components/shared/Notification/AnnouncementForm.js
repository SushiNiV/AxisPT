import React, { useState } from 'react';
import Modal from '../../ui/Modal'; // Adjust path
import Button from '../../ui/Button'; // Adjust path
import TextField from '../../ui/Textfield'; // Adjust path
import Alert from '../../ui/Alert'; // Adjust path

export default function AnnouncementForm({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/notifications/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, body, audience, programId: null }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to post');
      
      setTitle('');
      setBody('');
      setAudience('all');
      onSuccess(); // e.g. trigger a refresh of the feed
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Post an Announcement"
      size="sm"
      footer={({ requestClose }) => (
        <>
          <Button variant="ghost" onClick={requestClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            Post Announcement
          </Button>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <TextField
          id="announcement-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g. Schedule Change for Finals"
        />

        <div className="space-y-1.5">
          <label htmlFor="announcement-body" className="block text-sm font-medium text-ink">
            Message
          </label>
          <textarea
            id="announcement-body"
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-ctl bg-surface-2 px-3.5 py-3 text-base text-ink ring-1 ring-line-strong transition-shadow placeholder:text-ink-3 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            placeholder="Type your announcement here..."
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="announcement-audience" className="block text-sm font-medium text-ink">
            Audience
          </label>
          <select
            id="announcement-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="h-12 w-full rounded-ctl bg-surface-2 px-3.5 text-base text-ink ring-1 ring-line-strong transition-shadow focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <option value="all">Everyone</option>
            <option value="students">Students Only</option>
            <option value="faculty">Faculty Only</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}