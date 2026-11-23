import React from 'react';
import FitText from './FitText';

export default function EditableField({ 
  value, 
  onChange, 
  isEditing, 
  multiline = false,
  className = "value-line",
  placeholder = "",
  isTable = false,
  maxLength = 50 // Default limit
}) {
  if (!isEditing) {
    return (
      <FitText as="div" className={className} multiline={multiline} title={value}>
        {value || ''}
      </FitText>
    );
  }

  const Component = multiline ? 'textarea' : 'input';

  return (
    <Component
      className={`edit-input ${className}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength} // <--- Prevents typing past the limit
      style={{
        width: '100%',
        minWidth: '100%',
        border: '1px dashed #3b82f6',
        backgroundColor: '#eff6ff',
        fontFamily: 'inherit',
        fontSize: isTable ? '10px' : 'inherit',
        padding: '2px',
        textAlign: isTable ? 'center' : 'center',
        outline: 'none'
      }}
    />
  );
}