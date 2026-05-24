import React, { useRef, useEffect } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import '../GlobalHistory.css';
import '../Global.css';

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
                {filter.options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
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