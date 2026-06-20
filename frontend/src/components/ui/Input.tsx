import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  fullWidth = true,
  ...props 
}) => {
  const baseStyles = "bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-colors duration-200";
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <input 
      className={`${baseStyles} ${widthStyle} ${className}`}
      {...props}
    />
  );
};