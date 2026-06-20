import React, { useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';

export const MessageList: React.FC = () => {
  const { messages, activeRoom } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty State Layout
  if (!activeRoom && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-base)]">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-lg font-medium">Select a channel to start chatting</p>
      </div>
    );
  }

  // Active Chat Layout
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-base)] space-y-6">
      {messages.map((msg, idx) => {
        const isSystem = msg.isSystem;
        const isDM = msg.room === 'DM';
        
        // System Announcements
        if (isSystem) {
          return (
            <div key={idx} className="flex justify-center my-4">
              <span className="text-xs bg-[var(--color-surface)] text-[var(--color-text-muted)] px-3 py-1 rounded-full border border-[var(--color-border)] shadow-sm">
                {msg.content}
              </span>
            </div>
          );
        }

        // Standard & Direct Messages
        return (
          <div key={idx} className={`flex flex-col ${isDM ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Meta Data (Name, Time, Badges) */}
            <div className="flex items-baseline space-x-2 mb-1.5 px-1">
              <span className="text-sm font-semibold text-[var(--color-text-main)]">
                {msg.sender}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {isDM && (
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] font-bold border border-[var(--color-accent)] px-1.5 py-0.5 rounded opacity-80">
                  Private
                </span>
              )}
            </div>

            {/* Message Bubble */}
            <div className={`px-4 py-2.5 rounded-xl shadow-sm max-w-[80%] ${
              isDM 
                ? 'bg-[var(--color-accent)] text-white rounded-tr-sm' 
                : 'bg-[var(--color-surface)] text-[var(--color-text-main)] border border-[var(--color-border)] rounded-tl-sm'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.content}
              </p>
            </div>

          </div>
        );
      })}
      {/* Invisible element to force auto-scroll to bottom */}
      <div ref={bottomRef} />
    </div>
  );
};