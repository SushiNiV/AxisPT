import React, { useState } from 'react';
import { BiBell, BiMenu } from 'react-icons/bi';
import ProfileDrawer from '../ProfileDrawer';

const ICON_BTN =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink ' +
  'transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/**
 * Page header: menu button (mobile), title, notifications, and the profile avatar
 * that opens the profile drawer. Horizontal padding matches the legacy PageContent
 * so the title lines up with page content.
 */
export default function PageHeader({ title, subtitle, user, onMenuClick, onChangePassword }) {
  const [profileOpen, setProfileOpen] = useState(false);
  // Admin users have `name`; student users have `firstName`.
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
          {/* TODO: wire up notifications (this was a non-interactive icon before). */}
          <button type="button" aria-label="Notifications" className={`${ICON_BTN} text-xl`}>
            <BiBell />
          </button>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Open profile"
            className={`${ICON_BTN} overflow-hidden border-0 bg-brand font-semibold text-brand-on hover:bg-brand-hover`}
          >
            {user?.profileUrl ? (
              <img src={user.profileUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
          </button>
        </div>
      </header>

      {/* Rendered outside the .ax header so the legacy drawer styles are untouched. */}
      <ProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} user={user}
        onChangePassword={onChangePassword}
      />
    </>
  );
}