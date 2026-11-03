import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BiLeftArrowAlt, BiRightArrowAlt, BiSun, BiMoon, BiPowerOff } from 'react-icons/bi';
import ConfirmationModal from '../shared/ConfirmationModal';
import useMediaQuery from '../useMediaQuery';
import useTheme from './useTheme';
import markMaroon from '../../assets/AxisMark-maroon.png';
import markGold from '../../assets/AxisMark-gold.png';

const COLLAPSE_KEY = 'sidebarCollapsed';

const ROSE = '#893a49';
const DEEP = '#4c1208';
const GOLD = '#ffcb57';

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';
const FOCUS_ON_DARK = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60';

export default function Sidebar({ nav, product, pathname, mobileOpen, onClose, onLogout, promo }) {
  const [dark, toggleTheme] = useTheme();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [collapsedPref, setCollapsedPref] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const touchStartX = useRef(null);

  const rail = collapsedPref && isDesktop;
  
  // Get the role directly from storage
  const role = sessionStorage.getItem('role') || localStorage.getItem('role');
  const displayRole = role === 'faculty' ? 'Faculty' : 'Administrator';

  const toggleCollapse = () => {
    const next = !collapsedPref;
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    setCollapsedPref(next);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current !== null && touchStartX.current - e.changedTouches[0].clientX > 60) onClose();
    touchStartX.current = null;
  };

  const asideClass = [
    'ax flex flex-col transition-[transform,width,visibility] duration-200 motion-reduce:transition-none',
    'fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-surface',
    mobileOpen ? 'visible translate-x-0 shadow-lift' : 'invisible -translate-x-full',
    'md:visible md:relative md:z-20 md:my-3 md:ml-3 md:mr-3 md:translate-x-0 md:rounded-panel',
    rail
      ? 'md:w-[84px] md:bg-gradient-to-b md:from-[#893a49] md:to-[#4c1208]'
      : 'md:w-64 md:border md:border-line/60',
  ].join(' ');

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} aria-hidden="true" />}

      <aside onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }} onTouchEnd={handleTouchEnd} className={asideClass}>
        {/* Brand */}
        {rail ? (
          <div className="flex justify-center pb-3 pt-5">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${dark ? 'bg-white/15' : 'bg-white shadow-sm'}`}>
              <img src={dark ? markGold : markMaroon} alt="Axis Portal" className="h-8 w-8 object-contain" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 pb-4 pt-6">
            <img src={dark ? markGold : markMaroon} alt="" className="h-10 w-10 shrink-0 object-contain" />
            <div className="min-w-0">
              <p 
                className={`truncate font-display text-xl font-semibold leading-tight ${dark ? '' : 'text-brand-ink'}`}
                style={dark ? { color: GOLD } : {}}
              >
                {/* Displays "Administrator" or "Faculty" dynamically */}
                {displayRole}
              </p>
              <p className="truncate text-sm text-ink-2">{product}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav aria-label="Main" className={`flex-1 overflow-y-auto ${rail ? 'flex flex-col items-center gap-2 px-0 py-3' : 'space-y-1.5 px-3 py-2'}`}>
          {nav.map((item) => {
            const active = pathname.startsWith(item.match || item.to);
            const Icon = item.icon;

            if (rail) {
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`grid h-11 w-11 place-items-center rounded-full text-xl transition-colors ${FOCUS_ON_DARK} ${
                    active ? 'bg-white/15 text-[#ffcb57]' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon aria-hidden="true" />
                </Link>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-11 w-full items-center gap-3 rounded-ctl px-3 text-[15px] font-medium transition-colors ${FOCUS} ${
                  active ? 'bg-brand-soft font-semibold text-brand-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {active && (
                  <span aria-hidden="true" className="absolute -left-3 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand" />
                )}
                <Icon className="shrink-0 text-xl" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {rail ? (
          <div className="flex flex-col items-center gap-3 pb-4 pt-2">
            <button
              type="button"
              onClick={toggleCollapse}
              aria-label="Expand sidebar"
              aria-expanded={false}
              className={`grid h-11 w-11 place-items-center rounded-full bg-white text-2xl transition-transform hover:scale-105 ${FOCUS_ON_DARK}`}
              style={{ color: ROSE }}
            >
              <BiRightArrowAlt aria-hidden="true" />
            </button>

            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-label="Dark mode"
              onClick={toggleTheme}
              className={`grid h-11 w-11 place-items-center rounded-full bg-white text-xl transition-transform hover:scale-105 ${FOCUS_ON_DARK}`}
              style={{ color: ROSE }}
            >
              {dark ? <BiMoon aria-hidden="true" /> : <BiSun aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              title="Log out"
              aria-label="Log out"
              className={`grid h-11 w-11 place-items-center rounded-full text-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white ${FOCUS_ON_DARK}`}
            >
              <BiPowerOff aria-hidden="true" />
            </button>

            {promo && (
              <Link
                to={promo.to}
                aria-label="Learn more about Axis Portal"
                title="Learn more about Axis Portal"
                className={`flex w-11 flex-col items-center gap-1 rounded-2xl bg-black/45 py-3 font-display text-sm font-bold ${FOCUS_ON_DARK}`}
                style={{ color: GOLD }}
              >
                {'AXIS'.split('').map((letter) => (
                  <span key={letter} aria-hidden="true">{letter}</span>
                ))}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <div className="hidden justify-end md:flex">
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label="Collapse sidebar"
                aria-expanded
                className={`grid h-10 w-10 place-items-center rounded-full bg-brand text-2xl text-brand-on transition-transform hover:scale-105 ${FOCUS}`}
              >
                <BiLeftArrowAlt aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={dark}
              aria-label="Dark mode"
              onClick={toggleTheme}
              className={`flex h-12 w-full items-center justify-between rounded-ctl bg-gradient-to-r from-[#893a49] to-[#4c1208] px-4 text-sm font-semibold text-white ${FOCUS_ON_DARK}`}
            >
              Theme
              <span aria-hidden="true" className="relative h-8 w-[3.75rem] rounded-full bg-white/90">
                <BiSun className="absolute left-2 top-1/2 -translate-y-1/2 text-base" style={{ color: `${DEEP}73` }} />
                <BiMoon className="absolute right-2 top-1/2 -translate-y-1/2 text-base" style={{ color: `${DEEP}73` }} />
                <span
                  className={`absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full text-sm transition-transform motion-reduce:transition-none ${dark ? 'translate-x-[1.75rem]' : ''}`}
                  style={{ backgroundColor: GOLD, color: DEEP }}
                >
                  {dark ? <BiMoon /> : <BiSun />}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className={`flex h-10 w-full items-center gap-2 rounded-ctl px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger ${FOCUS}`}
            >
              <BiPowerOff aria-hidden="true" className="text-lg" />
              Log out
            </button>

            {promo && (
              <div className="rounded-panel bg-gradient-to-br from-[#893a49] to-[#4c1208] p-4 text-white">
                <p className="font-display text-sm font-light leading-tight">Know more about</p>
                <p className="mt-0.5 font-display text-lg font-bold leading-tight" style={{ color: GOLD }}>
                  AXIS PORTAL<span className="text-white">?</span>
                </p>
                <Link
                  to={promo.to}
                  className={`mt-3 flex h-9 w-full items-center justify-center rounded-ctl bg-white text-sm font-medium ${FOCUS_ON_DARK}`}
                  style={{ color: DEEP }}
                >
                  Learn more
                </Link>
              </div>
            )}
          </div>
        )}
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