import React from 'react';

export default function EditableCheckbox({ 
  checked, 
  onChange, 
  isEditing, 
  label,
  inputClass = "tiny-check" 
}) {
  if (!isEditing) {
    return (
      <div className="checkbox-item">
        <input type="checkbox" className={inputClass} checked={checked} readOnly />
        <span className="sub-label">{label}</span>
      </div>
    );
  }

  return (
    <div className="checkbox-item">
      <input 
        type="checkbox" 
        className={inputClass}
        checked={checked} 
        onChange={(e) => onChange(e.target.checked)} 
        style={{ outline: '1px solid #3b82f6', cursor: 'pointer' }}
      />
      <span className="sub-label">{label}</span>
    </div>
  );
}