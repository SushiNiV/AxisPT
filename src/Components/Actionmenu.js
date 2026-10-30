import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BiDotsVerticalRounded } from 'react-icons/bi';

const ITEM_HEIGHT = 40;

/**
 * "More actions" (⋮) menu. Rendered in a portal with fixed positioning so it is never
 * clipped by a scrolling table. Flips upward near the bottom of the screen.
 *
 * @param {Array<{label:string, icon?:Function, onClick:()=>void, danger?:boolean}>} items
 */
export default function ActionMenu({ items, label = 'More actions' }) {
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const close = useCallback(() => setPos(null), []);

  const toggle = (e) => {
    e.stopPropagation();
    if (pos) return close();
    const r = triggerRef.current.getBoundingClientRect();
    const menuHeight = items.length * ITEM_HEIGHT + 8;
    const openUp = r.bottom + menuHeight + 8 > window.innerHeight;
    return setPos({
      right: window.innerWidth - r.right,
      ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  };

  useEffect(() => {
    if (!pos) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [pos, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(pos)}
        onClick={toggle}
        className="grid h-9 w-9 place-items-center rounded-ctl text-xl text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <BiDotsVerticalRounded />
      </button>

      {pos &&
        createPortal(
          <div className="ax fixed inset-0 z-[1000]" onClick={close}>
            <div
              role="menu"
              style={pos}
              onClick={(e) => e.stopPropagation()}
              className="absolute min-w-40 rounded-ctl border border-line bg-surface p-1 shadow-lift"
            >
              {items.map(({ label: text, icon: Icon, onClick, danger }) => (
                <button
                  key={text}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onClick();
                  }}
                  className={`flex h-10 w-full items-center gap-2.5 rounded-md px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    danger ? 'text-danger hover:bg-danger-soft' : 'text-ink hover:bg-surface-2'
                  }`}
                >
                  {Icon && <Icon className="text-lg" aria-hidden="true" />}
                  {text}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}