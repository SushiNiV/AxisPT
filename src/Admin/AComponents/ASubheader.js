import React, { useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import '../../GlobalStyle/Global.css'
import '../../GlobalStyle/GlobalHeader.css'

function ASubheader({ tabs }) {
  const containerRef = useRef(null);
  const { pathname } = useLocation();


  const updateFades = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    el.classList.toggle('fadeLeft', scrollLeft > 4);
    el.classList.toggle('fadeRight', scrollLeft + clientWidth < scrollWidth - 4);
  }, []);


  useEffect(() => {
    const container = containerRef.current;
    const active = container?.querySelector('.SubheaderBlob.active');
    if (!container || !active) return;

    const c = container.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    container.scrollTo({
      left: container.scrollLeft + (a.left - c.left) - (c.width - a.width) / 2,
      behavior: 'smooth',
    });
  }, [pathname]);


  useEffect(() => {
    updateFades();
    window.addEventListener('resize', updateFades);
    return () => window.removeEventListener('resize', updateFades);
  }, [tabs, updateFades]);

  if (!tabs || tabs.length === 0) return null;
  return (
    <div className="SubheaderContainer" ref={containerRef} onScroll={updateFades}>
      {tabs.map((tab, index) => (
        <NavLink
          key={index}
          to={tab.path}
          className={({ isActive }) => `SubheaderBlob ${isActive ? 'active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export default ASubheader;