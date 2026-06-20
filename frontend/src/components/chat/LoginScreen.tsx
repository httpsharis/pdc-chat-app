import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const LoginScreen: React.FC = () => {
  const [name, setName] = useState('');
  const { login, error } = useChat(); // Pull the new error state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-[400px] p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-medium text-[var(--color-text-main)] tracking-tight mb-2">
            PDC Chat
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Identify yourself to join the cluster.
          </p>
        </div>

        {/* NEW: DISPLAY THE ERROR IF IT EXISTS */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1">
              Username
            </label>
            <Input 
              id="username"
              type="text" 
              placeholder="e.g. haris_dev" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              maxLength={20}
              className="w-full bg-[var(--color-base)] border-[var(--color-border)] text-[var(--color-text-main)] focus:border-[var(--color-accent)] transition-colors py-3"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-[var(--color-text-main)] hover:opacity-90 text-[var(--color-base)] transition-opacity py-3 rounded-lg font-medium text-lg"
          >
            Connect
          </Button>
        </form>
        
      </div>
    </div>
  );
};