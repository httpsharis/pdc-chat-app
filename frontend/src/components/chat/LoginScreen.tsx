import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Error message mapping
const ERROR_MESSAGES: Record<string, { message: string; type: 'error' | 'warning' | 'info' }> = {
  username_taken: {
    message: "This username is currently in use. Try another name or wait a moment.",
    type: 'error',
  },
  network_error: {
    message: "Cannot reach the server. Ensure the backend is running on port 5000.",
    type: 'warning',
  },
  server_error: {
    message: "Server encountered an error. Please try again.",
    type: 'warning',
  },
  disconnected: {
    message: "Connection lost. Click Connect to rejoin.",
    type: 'info',
  },
};

const ERROR_STYLES: Record<string, string> = {
  error: 'bg-red-500/10 border-red-500/25 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  info: 'bg-blue-500/10 border-blue-500/25 text-blue-400',
};

const ErrorIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconClass = "w-4 h-4 mt-0.5 flex-shrink-0";

  switch (type) {
    case 'error':
      return (
        <svg className={`${iconClass} text-red-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={`${iconClass} text-amber-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'info':
      return (
        <svg className={`${iconClass} text-blue-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export const LoginScreen: React.FC = () => {
  const [name, setName] = useState(()=> {
    return localStorage.getItem("chat_last_username") || ""
  });
  const { login, error, clearError, isReconnecting } = useChat();

  const errorConfig = error ? ERROR_MESSAGES[error] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-base)] flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Subtle background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[var(--color-accent)] opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px] p-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 mb-5">
            <svg className="w-7 h-7 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-text-main)] tracking-tight mb-2">
            PDC Chat
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Identify yourself to join the cluster.
          </p>
        </div>

        {/* Error Display - CSS animation only, no state */}
        {error && errorConfig && (
          <div className="mb-6 animate-fade-in">
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border ${ERROR_STYLES[errorConfig.type]}`}
            >
              <ErrorIcon type={errorConfig.type} />
              <p className="text-sm leading-relaxed">
                {errorConfig.message}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider ml-1"
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="e.g. haris_dev"
              value={name}
              onChange={handleInputChange}
              autoFocus
              required
              maxLength={20}
              disabled={isReconnecting}
              className={`w-full bg-[var(--color-base)] border-[var(--color-border)] text-[var(--color-text-main)] focus:border-[var(--color-accent)] transition-colors py-3 ${
                error === 'username_taken'
                  ? 'border-red-500/50 focus:border-red-500/50'
                  : ''
              }`}
            />
          </div>

          <Button
            type="submit"
            disabled={!name.trim() || isReconnecting}
            className="w-full bg-[var(--color-text-main)] hover:opacity-90 text-[var(--color-base)] transition-opacity py-3 rounded-lg font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReconnecting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Connecting...
              </span>
            ) : (
              'Connect'
            )}
          </Button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-[var(--color-text-muted)] text-xs mt-8 opacity-60">
          No password required — just pick a name and start talking
        </p>
      </div>
    </div>
  );
};