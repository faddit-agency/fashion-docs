"use client";

import { useState, useRef, useEffect } from "react";

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

export function InlineTextEditor({ 
  value, 
  onChange, 
  onBlur, 
  className = "", 
  placeholder = "텍스트를 입력하세요" 
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() !== value) {
      onChange(editValue);
    }
    setIsEditing(false);
    onBlur?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-white border border-blue-500 rounded px-2 py-1 text-sm ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-blue-50 px-1 rounded ${className}`}
    >
      {value || placeholder}
    </span>
  );
}
