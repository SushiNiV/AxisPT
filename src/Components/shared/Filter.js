import React, { useEffect, useRef } from 'react';
import { BiFilterAlt, BiChevronDown } from 'react-icons/bi';
import Button from '../ui/Button';
import BottomSheet from '../ui/Bottomsheet';
import useMediaQuery from '../useMediaQuery';

const toOption = (o) =>
  typeof o === 'object' ? { value: o.value, label: o.label } : { value: o, label: o };

/** The filter fields plus Reset / Apply. Shared by the desktop popover and the mobile sheet. */
function FilterForm({ filters, onFilterChange, onReset, onApply }) {
  return (
    <div className="space-y-4">
      {filters.map((filter) => {
        const id = `filter-${filter.name}`;
        return (
          <div key={filter.name} className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-ink">
              {filter.label}
            </label>
            {/* Native select: gets the OS picker on phones and works with every keyboard and screen reader. */}
            <div className="relative">
              <select
                id={id}
                value={filter.value ?? ''}
                onChange={(e) => onFilterChange(filter.name, e.target.value)}
                className="h-11 w-full appearance-none rounded-ctl border border-line-strong bg-surface pl-3.5 pr-10 text-base text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15 sm:text-sm"
              >
                <option value="" className="bg-surface text-ink">
                  {filter.placeholder || `All ${filter.label.toLowerCase()}`}
                </option>
                {filter.options.map(toOption).map((o) => (
                  <option key={o.value} value={o.value} className="bg-surface text-ink">
                    {o.label}
                  </option>
                ))}
              </select>
              <BiChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-ink-3"
              />
            </div>
          </div>
        );
      })}

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onReset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={onApply}>
          Apply
        </Button>
      </div>
    </div>
  );
}

/**
 * Filter button. Opens a popover on desktop and a bottom sheet on mobile.
 * Same props as before: isOpen, setIsOpen, hasActiveFilters, filters, onFilterChange, onReset, onApply.
 * `filters` items: { name, label, value, options, placeholder? }.
 */
function Filter({ isOpen, setIsOpen, hasActiveFilters, filters, onFilterChange, onReset, onApply }) {
  const ref = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Desktop popover: close on outside click and Escape. (The mobile sheet handles its own backdrop.)
  useEffect(() => {
    if (!isOpen || isMobile) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, isMobile, setIsOpen]);

  const form = <FilterForm filters={filters} onFilterChange={onFilterChange} onReset={onReset} onApply={onApply} />;

  return (
    <div ref={ref} className="ax relative shrink-0">
      <Button
        variant="secondary"
        aria-label="Filters"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative !px-3 sm:!px-4 ${hasActiveFilters ? '!border-brand !bg-brand-soft !text-brand-ink' : ''}`}
      >
        <BiFilterAlt className="text-lg" aria-hidden="true" />
        <span className="hidden sm:inline">Filter</span>
        {hasActiveFilters && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-surface" />
        )}
      </Button>

      {isOpen && !isMobile && (
        <div
          role="dialog"
          aria-label="Filters"
          className="absolute right-0 top-12 z-30 w-80 rounded-panel border border-line bg-surface p-4 shadow-lift"
        >
          <h2 className="mb-3 text-base font-semibold text-ink">Filters</h2>
          {form}
        </div>
      )}

      <BottomSheet open={isOpen && isMobile} onClose={() => setIsOpen(false)} title="Filters">
        {form}
      </BottomSheet>
    </div>
  );
}

export default Filter;