import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 ease-in-out rounded-lg outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Mapped entirely to CSS variables. Inverse colors for primary to make it pop.
  const variants = {
    primary: "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white",
    secondary: "bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-[var(--color-text-main)] border border-[var(--color-border)]",
    ghost: "bg-transparent hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};