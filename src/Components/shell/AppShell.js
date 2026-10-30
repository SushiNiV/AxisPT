import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PageHeader from './Pageheader';
import '../../GlobalStyle/Global.css';

/**
 * AppShell — the shared layout for every signed-in portal (admin, student).
 * Each portal supplies its own navigation and branding; the shell owns the layout,
 * mobile drawer, theme, logout, and header.
 *
 * @param {Array<{to:string, label:string, icon:Function, match?:string, title?:string}>} nav
 *        Sidebar items. `match` is the path prefix that marks the item active
 *        (defaults to `to`). `title` overrides the page title shown in the header.
 * @param {Array<{match:string, title:string}>} [extraTitles] Titles for routes not in the sidebar.
 * @param {string} portalRole  Role label in the sidebar, e.g. "Administrator".
 * @param {string} product     Product name under it, e.g. "Axis CPT Portal".
 * @param {string} logo        Logo image URL (imported by the caller).
 * @param {string} [subtitle]  Line under the page title.
 * @param {{name:string,email:string,role:string,profileUrl:?string}} user
 * @param {string} logoutTo    Route to open after logging out.
 * @param {React.ReactNode} [assistant] Floating widget (e.g. <AssistantWidget />).
 * @param {Function} [onChangePassword] Passed to the profile drawer (student portal).
 */
export default function AppShell({
  nav,
  extraTitles = [],
  portalRole,
  product,
  logo,
  subtitle,
  user,
  logoutTo,
  assistant,
  onChangePassword,
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hideAssistant, setHideAssistant] = useState(false);
  const lastScrollY = useRef(0);

  // Close the mobile drawer after navigating, and on Escape.
  useEffect(() => setMobileNavOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMobileNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  const current = [...nav, ...extraTitles].find((i) => pathname.startsWith(i.match || i.to));
  const title = current?.title || current?.label || portalRole;

  // Hide the assistant while scrolling down, show it when scrolling up.
  const handlePageScroll = (e) => {
    const y = e.target.scrollTop;
    if (y > lastScrollY.current + 10) setHideAssistant(true);
    else if (y < lastScrollY.current - 10) setHideAssistant(false);
    lastScrollY.current = y;
  };

  const handleLogout = () => {
    document.body.classList.remove('dark');
    sessionStorage.clear();
    localStorage.clear();
    navigate(logoutTo);
  };

  return (
    <div className="flex h-dvh w-full bg-canvas">
      <Sidebar
        nav={nav}
        portalRole={portalRole}
        product={product}
        logo={logo}
        pathname={pathname}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          title={title}
          subtitle={subtitle}
          user={user}
          onMenuClick={() => setMobileNavOpen(true)}
          onChangePassword={onChangePassword}
        />

        {/* `PageContent` is kept as a hook: unmigrated pages (.InnerContainer etc.) rely on its legacy layout. */}
        <main className="PageContent" onScroll={handlePageScroll}>
          <Outlet />
        </main>
      </div>

      {/* `AssistantWrap` is kept: legacy CSS hides it behind bulk-action bars and the profile drawer. */}
      {assistant && <div className={`AssistantWrap ${hideAssistant ? 'scrolledDown' : ''}`}>{assistant}</div>}
    </div>
  );
}