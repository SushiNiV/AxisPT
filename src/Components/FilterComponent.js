import React, { useState, useRef, useEffect } from 'react';
import './FilterComponent.css';
import { BiFilterAlt, BiChevronDown } from 'react-icons/bi';

function FilterComponent({ filters, onApply }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [activeGroup, setActiveGroup] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (label, option) => {
    setFilterValues(prev => {
      const currentSelection = prev[label] || [];
      const newSelection = currentSelection.includes(option)
        ? currentSelection.filter(item => item !== option)
        : [...currentSelection, option];
      return { ...prev, [label]: newSelection };
    });
  };

  const toggleGroup = (index) => {
    setActiveGroup(activeGroup === index ? null : index);
  };

  const handleReset = () => {
    setFilterValues({});
    onApply({});
    setIsOpen(false);
  };

  const handleApply = () => {
    onApply(filterValues);
    setIsOpen(false);
  };

  const getSortedDisplay = (label, options) => {
    const currentSelection = filterValues[label] || [];
    const sortedSelection = options.filter(opt => currentSelection.includes(opt));

    if (sortedSelection.length > 0) {
      return sortedSelection.join(", ").toUpperCase();
    }
    const placeholder = filters.find(f => f.label === label)?.placeholder;
    return (placeholder || `All ${label}s`).toUpperCase();
  };

  return (
    <div className="filterContainer" ref={dropdownRef}>
      <button 
        className={`filterToggleBtn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BiFilterAlt className="linkIcon" />
        Filter
      </button>

      {isOpen && (
        <div className="filterDropdown">
          {filters.map((f, index) => (
            <div className="filterGroup" key={index}>
              <label className="sectionLabel">{f.label}</label>
              
              <div 
                className={`customSelectTrigger ${activeGroup === index ? 'focused' : ''}`}
                onClick={() => toggleGroup(index)}
              >
                <div className="selectedTextDisplay">
                  {getSortedDisplay(f.label, f.options)}
                </div>
                <BiChevronDown className={`arrowIcon ${activeGroup === index ? 'rotate' : ''}`} />

                {activeGroup === index && (
                  <div className="checkboxListContainer" onClick={(e) => e.stopPropagation()}>
                    {f.options.map((opt, i) => (
                      <label key={i} className="checkboxItem">
                        <input 
                          type="checkbox"
                          checked={(filterValues[f.label] || []).includes(opt)}
                          onChange={() => toggleOption(f.label, opt)}
                        />
                        <span>{opt.toUpperCase()}</span> 
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="filterBtnsContainer">
            <button className="resetFilterBtn" onClick={handleReset}>Reset</button>
            <button className="applyFilterBtn" onClick={handleApply}>Apply Filters</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FilterComponent;