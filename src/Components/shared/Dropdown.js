import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BiChevronDown, BiCheck } from 'react-icons/bi';
import cx from '../ui/Cx';

function Dropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option', 
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUpwards: false });
  
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const getClipRect = (el) => {
  let node = el.parentElement;
  while (node && node !== document.body) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
      return node.getBoundingClientRect();
    }
    node = node.parentElement;
  }
  return { top: 0, bottom: window.innerHeight };
};

  const calculatePosition = () => {
  const el = triggerRef.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const clip = getClipRect(el);

  // trigger scrolled out of view -> close instead of floating over other UI
  if (rect.bottom < clip.top + 8 || rect.top > clip.bottom - 8) {
    setIsOpen(false);
    return;
  }

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  setCoords({
    top: rect.bottom + 4,
    bottom: window.innerHeight - rect.top + 4,
    left: rect.left,
    width: rect.width,
    openUpwards: spaceBelow < 250 && spaceAbove > spaceBelow,
  });
};

  const toggleOpen = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
  if (!isOpen) return;
  const onScroll = (e) => {
    if (menuRef.current?.contains(e.target)) return;
    calculatePosition();
  };
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', calculatePosition);
  return () => {
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', calculatePosition);
  };
}, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = options.filter(opt => String(opt.value) !== '');
  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  const menuContent = (
    <div 
      ref={menuRef}
      data-dropdown-portal="true"
      style={{
        position: 'fixed',
        top: coords.openUpwards ? 'auto' : coords.top,
        bottom: coords.openUpwards ? coords.bottom : 'auto',
        left: coords.left,
        width: coords.width,
        zIndex: 99999,
      }}
      className="ax max-h-60 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-ctl bg-surface p-1 shadow-xl ring-1 ring-line-strong select-none"
      role="listbox"
    >
      {filteredOptions.length === 0 ? (
        <div className="px-3 py-2 text-sm text-ink-3">No options available</div>
      ) : (
        filteredOptions.map((opt) => {
          const isSelected = String(value) === String(opt.value);
          return (
            <div
              key={opt.value}
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(opt.value)}
              className={cx(
                "flex cursor-pointer items-center justify-between truncate rounded-md px-3 py-2 text-sm transition-colors",
                isSelected ? "bg-brand text-brand-on" : "text-ink hover:bg-surface-2"
              )}
            >
              <span className="truncate">{opt.label}</span>
              {isSelected && <BiCheck className="shrink-0 text-lg" />}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <div className="relative w-full">
        <div 
          ref={triggerRef}
          className={cx(
            "flex h-12 w-full cursor-pointer items-center justify-between rounded-ctl bg-surface-2 px-3.5 text-base text-ink transition-shadow select-none",
            "ring-1 ring-line-strong",
            isOpen ? "bg-surface ring-2 ring-brand/40" : "hover:bg-surface-2/80",
            disabled ? "cursor-not-allowed opacity-60" : ""
          )}
          onClick={() => !disabled && toggleOpen()}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && toggleOpen();
            }
          }}
        >
          <span className={cx("truncate", !selectedOption ? "text-ink-3" : "text-ink")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <BiChevronDown className={cx("shrink-0 text-xl text-ink-3 transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && createPortal(menuContent, document.body)}
    </>
  );
}

export default Dropdown;