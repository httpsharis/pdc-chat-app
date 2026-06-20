import React, { useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { Button } from '../ui/Button';

export const MessageInput: React.FC = () => {
  const [text, setText] = useState('');
  const { sendMessage, sendDM, activeRoom, joinRoom } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (text.startsWith('/join ')) {
      const newRoom = text.split(' ')[1];
      if (newRoom) joinRoom(newRoom);
    } else if (text.startsWith('/dm ')) {
      const parts = text.split(' ');
      if (parts.length >= 3) {
        const targetUser = parts[1];
        const msg = parts.slice(2).join(' ');
        sendDM(targetUser, msg);
      }
    } else if (activeRoom && activeRoom.startsWith('@')) {
      // Smart routing: Send as DM if in a private chat tab
      const targetUser = activeRoom.slice(1);
      sendDM(targetUser, text.trim());
    } else {
      // Standard public message
      sendMessage(text.trim());
    }

    setText('');
  };

  const isDisabled = !activeRoom && !text.startsWith('/');

  // Update placeholder to show exactly who you are talking to
  const placeholderText = activeRoom?.startsWith('@')
    ? `Message ${activeRoom.slice(1)}...`
    : isDisabled
      ? "Type /join general to start..."
      : `Message #${activeRoom}...`;

  return (
    <div className="p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          className="flex-1 bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors shadow-sm"
        />

        <Button
          type="submit"
          disabled={!text.trim()}
          className="px-6 rounded-xl shadow-sm"
        >
          <svg className="w-5 h-5 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V6m0 0l-8 8m8-8l8 8" />
          </svg>
        </Button>
      </form>
    </div>
  );
};