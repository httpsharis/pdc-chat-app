import React from 'react';
import { Sidebar } from './Sidebar';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChat } from '../../hooks/useChat';

export const ChatLayout: React.FC = () => {
  const { activeRoom, contacts, toggleFavorite, sendMessage } = useChat();

  const isDM = activeRoom?.startsWith('@');
  const targetUser = isDM ? activeRoom.slice(1) : null;
  const targetContact = isDM ? contacts.find(c => c.username === targetUser) : null;

  return (
    <div className="flex h-screen bg-[var(--color-base)] overflow-hidden text-[var(--color-text-main)] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col relative">
        
        {/* Solid, minimalist header */}
        <header className="h-16 flex items-center justify-between px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-10 shadow-sm">
          <div className="flex items-center">
            {activeRoom ? (
              <>
                <span className="text-[var(--color-accent)] font-bold text-xl mr-2">
                  {isDM ? '@' : '#'}
                </span>
                <h1 className="text-lg font-medium tracking-tight">
                  {targetUser || activeRoom}
                </h1>
              </>
            ) : (
              <h1 className="text-lg font-medium text-[var(--color-text-muted)] tracking-tight">
                No Channel Selected
              </h1>
            )}
          </div>

          {isDM && targetUser && (
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => toggleFavorite(targetUser)}
                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-yellow-500 hover:bg-[var(--color-base)] transition-colors"
                title={targetContact?.isFavorite ? "Unfavorite User" : "Favorite User"}
              >
                <svg className={`w-5 h-5 ${targetContact?.isFavorite ? 'text-yellow-500' : ''}`} fill={targetContact?.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={targetContact?.isFavorite ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
              
              <button 
                onClick={() => {
                  if (confirm(`Are you sure you want to kick ${targetUser} from the server?`)) {
                    sendMessage(`/kick ${targetUser}`);
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                title={`Kick ${targetUser} from the server`}
              >
                Kick User
              </button>
            </div>
          )}
        </header>

        {/* Chat Area */}
        <MessageList />
        
        {/* Input Area */}
        <MessageInput />
        
      </main>
    </div>
  );
};