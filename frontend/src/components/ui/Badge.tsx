import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'online' | 'offline' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  // We keep explicit semantic colors for online (green) and offline (gray) 
  // because status indicators have universal meanings regardless of the theme.
  const variants = {
    online: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    offline: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
    default: "bg-[var(--color-surface)] text-[var(--color-text-main)] border-[var(--color-border)]"
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {variant === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>}
      {variant === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mr-1.5"></span>}
      {children}
    </span>
  );
};