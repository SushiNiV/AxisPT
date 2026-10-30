import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * Section tabs shown under the page header.
 * On narrow screens the row scrolls, fades at the overflowing edges, and keeps
 * the active tab in view.
 * @param {Array<{path:string,label:string}>} tabs
 */
export default function SubNav({ tabs }) {
  const ref = useRef(null);
  const { pathname } = useLocation();
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFades = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setFade((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  }, []);

  // Keep the active tab centered when the route changes.
  useEffect(() => {
    const container = ref.current;
    const active = container?.querySelector('[aria-current="page"]');
    if (!container || !active) return;
    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    container.scrollTo({ left: container.scrollLeft + (a.left - c.left) - (c.width - a.width) / 2, behavior: 'smooth' });
  }, [pathname]);

  useEffect(() => {
    updateFades();
    window.addEventListener('resize', updateFades);
    return () => window.removeEventListener('resize', updateFades);
  }, [tabs, updateFades]);

  if (!tabs || tabs.length === 0) return null;

  const stops = [
    ...(fade.left ? ['transparent 0', '#000 28px'] : ['#000 0']),
    ...(fade.right ? ['#000 calc(100% - 28px)', 'transparent 100%'] : ['#000 100%']),
  ];
  const mask = fade.left || fade.right ? `linear-gradient(to right, ${stops.join(', ')})` : undefined;

  return (
    <div
      ref={ref}
      onScroll={updateFades}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className="ax mb-3 flex shrink-0 gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `inline-flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-4 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              isActive ? 'border-brand text-brand-ink' : 'border-transparent text-ink-2 hover:text-ink'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}