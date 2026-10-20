import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { BiChevronDown } from 'react-icons/bi';
import '../GlobalStyle/Dropdown.css'; 

function Dropdown({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option', 
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Calculate the position of the dropdown menu based on the trigger button
  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4, // 4px gap below the button
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Update position when opened, or when the window/modal is scrolled or resized
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      // The 'true' parameter captures scroll events from nested containers (like .modalScrollArea)
      window.addEventListener('scroll', updatePosition, true); 
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  // The dropdown menu component that will be portaled
  const dropdownMenu = (
    <div 
      className="dropdownOptions" 
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`,
        zIndex: 99999 // Ensure it's above the modal (modals are usually ~9999)
      }}
    >
      {options.length === 0 ? (
        <div className="dropdownOption" style={{ color: 'var(--text-muted)', cursor: 'default' }}>
          No options available
        </div>
      ) : (
        options.map((opt) => (
          <div
            key={opt.value}
            className={`dropdownOption ${String(value) === String(opt.value) ? 'selected' : ''}`}
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div className="dropdownContainer">
        <div 
          className={`dropdownTrigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          ref={triggerRef}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && setIsOpen(!isOpen);
            }
          }}
        >
          <span className={!selectedOption ? 'dropdownPlaceholder' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <BiChevronDown className="dropdownChevron" size={20} />
        </div>
      </div>

      {/* Render the menu into the body using a Portal */}
      {isOpen && ReactDOM.createPortal(dropdownMenu, document.body)}
    </>
  );
}

export default Dropdown;