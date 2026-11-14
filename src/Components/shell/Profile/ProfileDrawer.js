import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiX, BiLockAlt } from 'react-icons/bi';
import ProfileIdentity from './ProfileIdentity';
import Button from '../../ui/Button';
import BottomSheet from '../../ui/Bottomsheet';
import useMediaQuery from '../../useMediaQuery';

export default function ProfileDrawer({ isOpen, onClose, user }) {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const displayName = user?.name 
    || [user?.firstName || user?.first_name, user?.lastName || user?.last_name].filter(Boolean).join(' ') 
    || 'User';
  
  const role = user?.role || 'User';
  const email = user?.email || '—';
  const studentNumber = user?.studentNumber || user?.username;

  const handleGoToChangePassword = () => {
    onClose();
    navigate('/change-password'); // <-- Single route for both
  };

  const ProfileContent = (
    <div className="space-y-6">
      {/* Identity: photo (editable), name and role */}
      <ProfileIdentity name={displayName} role={role} />

      {/* Details Card */}
      <div className="rounded-panel border !border-line bg-surface overflow-hidden">
        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 p-4">
            <dt className="text-ink-2">Name</dt>
            <dd className="font-medium text-ink text-right">{displayName}</dd>
          </div>
          {studentNumber && (
            <div className="flex justify-between gap-4 p-4">
              <dt className="text-ink-2">Student No.</dt>
              <dd className="font-medium text-ink text-right tabular-nums">{studentNumber}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 p-4">
            <dt className="text-ink-2">Email</dt>
            <dd className="font-medium text-ink text-right break-all">{email}</dd>
          </div>
          <div className="flex justify-between gap-4 p-4">
            <dt className="text-ink-2">Role</dt>
            <dd className="font-medium text-ink text-right capitalize">{role}</dd>
          </div>
        </dl>
      </div>

      {/* Action */}
      <Button variant="secondary" className="w-full" onClick={handleGoToChangePassword}>
        <BiLockAlt className="text-lg" /> Change Password
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onClose={onClose} title="Profile">
        <div className="p-2">
          {ProfileContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop Slide-over
  return (
    <div className={`fixed inset-0 z-[1000] flex justify-end ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`ax relative flex h-full w-[380px] flex-col border-l !border-line bg-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
      >
        <header className="flex shrink-0 items-center justify-between border-b !border-line p-4">
          <h2 className="font-display text-lg font-semibold text-ink">Profile</h2>
          <button 
            onClick={onClose} 
            aria-label="Close profile"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <BiX className="text-xl" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ProfileContent}
        </div>
      </aside>
    </div>
  );
}