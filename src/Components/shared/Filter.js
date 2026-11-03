import React, { useEffect, useRef } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import Button from '../ui/Button';
import BottomSheet from '../ui/Bottomsheet';
import Dropdown from '../shared/Dropdown';
import useMediaQuery from '../useMediaQuery';

const toOption = (o) =>
  typeof o === 'object' ? { value: o.value, label: o.label } : { value: o, label: o };

function FilterForm({ filters, onFilterChange, onReset, onApply }) {
  return (
    <div className="space-y-4">
      {filters.map((filter) => {
        const dropdownOptions = [
          { value: "", label: filter.placeholder || `All ${filter.label.toLowerCase()}` },
          ...filter.options.map(toOption)
        ];

        return (
          <div key={filter.name} className="space-y-1.5">
            <label className="block text-sm font-medium text-ink">
              {filter.label}
            </label>
            
            <Dropdown
              options={dropdownOptions}
              value={filter.value ?? ''}
              onChange={(val) => onFilterChange(filter.name, val)}
              placeholder={filter.placeholder || `All ${filter.label.toLowerCase()}`}
            />
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

function Filter({ isOpen, setIsOpen, hasActiveFilters, filters, onFilterChange, onReset, onApply }) {
  const ref = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isOpen || isMobile) return undefined;
    const onDown = (e) => {
      // If the click is inside the Filter popover itself, do nothing
      if (ref.current && ref.current.contains(e.target)) return;
      
      // If the click is inside the Dropdown's portal (the options menu), do nothing
      if (e.target.closest('[data-dropdown-portal="true"]')) return;
      
      // Otherwise, close the filter
      setIsOpen(false);
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