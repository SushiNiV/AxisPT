import React, { useState } from 'react';
import { BiBell, BiMenu } from 'react-icons/bi';
import ProfileDrawer from './Profile/ProfileDrawer';
import useAvatar from './Profile/UseAvatar';

// FIXED: Replaced !border-line with !border-0 to remove borders entirely from all header buttons
const ICON_BTN =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full !border-0 bg-surface p-0 text-ink ' +
  'transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export default function PageHeader({ title, subtitle, user, onMenuClick, onChangePassword }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { src: avatarSrc, onError: onAvatarError } = useAvatar();
  const displayName = user?.name || user?.firstName || '';
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <>
      <header className="ax flex shrink-0 items-center gap-3 px-2 py-3 md:px-3 md:py-4 lg:px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className={`${ICON_BTN} rounded-ctl text-xl md:hidden`}
        >
          <BiMenu />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold text-brand-ink sm:text-2xl lg:text-3xl">{title}</h1>
          {subtitle && <p className="hidden truncate text-sm text-ink-2 sm:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className={`${ICON_BTN} text-xl`}>
            <BiBell />
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            /* The avatar inherits !border-0 from ICON_BTN, so no extra border classes are needed here */
            className={`${ICON_BTN} overflow-hidden bg-brand font-semibold text-brand-on hover:bg-brand-hover`}
          >
            {avatarSrc ? (
              <img 
                src={avatarSrc} 
                alt="" 
                onError={onAvatarError} 
                className="h-full w-full object-cover object-top" 
              />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </button>
        </div>
      </header>

      <ProfileDrawer 
        isOpen={profileOpen} 
        onClose={() => setProfileOpen(false)} 
        user={user}
        onChangePassword={onChangePassword}
      />
    </>
  );
}