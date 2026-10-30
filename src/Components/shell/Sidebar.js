import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BiChevronLeft, BiChevronRight, BiSun, BiMoon, BiPowerOff } from 'react-icons/bi';
// TODO: point this at the shared confirmation modal (it moves when we migrate modals).
import ConfirmationModal from '../../Admin/AComponents/ConfirmationModal';
import useTheme from './useTheme';

const COLLAPSE_KEY = 'sidebarCollapsed';

const ROW =
  'flex h-11 w-full items-center gap-3 rounded-ctl px-3 text-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

/** Responsive sidebar: fixed drawer on mobile, collapsible rail on desktop. See AppShell for props. */
export default function Sidebar({ nav, portalRole, product, logo, pathname, mobileOpen, onClose, onLogout }) {
  const [dark, toggleTheme] = useTheme();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const touchStartX = useRef(null);

  const toggleCollapse = () => {
    const next = !collapsed;
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    setCollapsed(next);
  };

  // Collapsing only affects desktop; the mobile drawer is always expanded.
  const hideWhenCollapsed = collapsed ? 'md:hidden' : '';
  const centerWhenCollapsed = collapsed ? 'md:justify-center md:px-0' : '';

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && touchStartX.current - e.changedTouches[0].clientX > 60) onClose();
    touchStartX.current = null;
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={handleTouchEnd}
        className={[
          'ax flex flex-col border-r border-line bg-surface transition-[transform,width,visibility] duration-200 motion-reduce:transition-none',
          'fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw]',
          mobileOpen ? 'visible translate-x-0 shadow-lift' : 'invisible -translate-x-full',
          'md:visible md:relative md:z-20 md:translate-x-0 md:shadow-none',
          collapsed ? 'md:w-[76px]' : 'md:w-64',
        ].join(' ')}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-4 py-5 ${centerWhenCollapsed}`}>
          <img src={logo} alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className={`min-w-0 ${hideWhenCollapsed}`}>
            <p className="truncate font-display text-xl font-semibold leading-tight text-brand-ink">{portalRole}</p>
            <p className="truncate text-sm text-ink-2">{product}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-7 hidden h-6 w-6 place-items-center rounded-full border border-line-strong bg-surface text-ink-2 shadow-lift hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:grid"
        >
          {collapsed ? <BiChevronRight /> : <BiChevronLeft />}
        </button>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const active = pathname.startsWith(item.match || item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={`${ROW} ${centerWhenCollapsed} ${
                  active ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <Icon className="shrink-0 text-xl" aria-hidden="true" />
                <span className={`truncate ${hideWhenCollapsed}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: theme + logout */}
        <div className="space-y-1 border-t border-line p-3">
          <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={toggleTheme}
            title={collapsed ? (dark ? 'Dark mode' : 'Light mode') : undefined}
            className={`${ROW} ${centerWhenCollapsed} text-ink-2 hover:bg-surface-2 hover:text-ink`}
          >
            {dark ? <BiMoon className="shrink-0 text-xl" /> : <BiSun className="shrink-0 text-xl" />}
            <span className={`flex-1 truncate text-left ${hideWhenCollapsed}`}>{dark ? 'Dark mode' : 'Light mode'}</span>
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${dark ? 'bg-brand' : 'bg-line-strong'} ${hideWhenCollapsed}`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform motion-reduce:transition-none ${
                  dark ? 'translate-x-4' : ''
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            title={collapsed ? 'Log out' : undefined}
            className={`${ROW} ${centerWhenCollapsed} text-ink-2 hover:bg-danger-soft hover:text-danger`}
          >
            <BiPowerOff className="shrink-0 text-xl" aria-hidden="true" />
            <span className={`truncate ${hideWhenCollapsed}`}>Log out</span>
          </button>
        </div>
      </aside>

      <ConfirmationModal
        isOpen={confirmOpen}
        title="Confirm Logout"
        summary="Are you sure you want to log out of the system?"
        message="Any unsaved changes may be lost."
        variant="info"
        confirmLabel="LOG OUT"
        cancelLabel="CANCEL"
        onConfirm={onLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}