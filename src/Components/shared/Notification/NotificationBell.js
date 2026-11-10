import React, { useState } from 'react';
import { BiBell } from 'react-icons/bi';
import useNotifications from './UseNotifications'; // <-- Fixed import
import NotificationPanel from './NotificationPanel'; // <-- Fixed import

export default function NotificationBell({ buttonClass }) {
  const [open, setOpen] = useState(false);
  const { count } = useNotifications();

  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => setOpen(!open)}
        aria-label="Notifications" 
        className={`${buttonClass} relative`}
      >
        <BiBell />
        
        {/* Badge */}
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Click outside overlay (desktop only) */}
      {open && (
        <div 
          className="hidden md:block fixed inset-0 z-[240]" 
          onClick={() => setOpen(false)} 
          aria-hidden="true" 
        />
      )}

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}