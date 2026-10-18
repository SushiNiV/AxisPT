import React, { useRef, useEffect } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import '../GlobalStyle/GlobalHistory.css';
import '../GlobalStyle/Global.css';
import useMediaQuery from './useMediaQuery';


function Filter({ 
  isOpen, 
  setIsOpen, 
  hasActiveFilters, 
  filters, 
  onFilterChange, 
  onReset, 
  onApply 
}) {
  const filterRef = useRef(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsOpen]);

  return (
    <div className="TopbarBtnContainer" ref={filterRef}>
      <button 
        className={`TopbarBtn ${isOpen ? 'Active' : ''} ${hasActiveFilters ? 'FilterActive' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BiFilterAlt className="linkIcon" />
        Filter
      </button>

      {isOpen && (
        <div className="FilterDropdown">
          {filters.map((filter, index) => (
            <div className="FilterGroup" key={index}>
              <label>{filter.label}</label>
              <select 
                value={filter.value} 
                onChange={(e) => onFilterChange(filter.name, e.target.value)}
              >
                <option value="">{filter.placeholder || `ALL ${filter.label}`}</option>
                {filter.options.map(option => {
                  const value = typeof option === 'object' ? option.value : option;
                  const label = typeof option === 'object' ? option.label : option;
                  return <option key={value} value={value}>{label}</option>;
                })}
              </select>
            </div>
          ))}
          <div className="BtnsContainer">
            <button className="ResetFilterBtn" onClick={onReset}>Reset</button>
            <button className="ApplyFilterBtn" onClick={onApply}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Filter;