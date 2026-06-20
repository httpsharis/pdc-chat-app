import React from 'react';
import { useChat } from '../../hooks/useChat';
import { Badge } from '../ui/Badge';

export const Sidebar: React.FC = () => {
  const { rooms, activeRoom, joinRoom, username, logout, contacts, switchToDM } = useChat();

  const handleAddChannel = () => {
    const channelName = prompt("Enter channel name to join/create:");
    if (channelName && channelName.trim()) {
      joinRoom(channelName.trim());
    }
  };

  const handleAddUser = () => {
    const userName = prompt("Enter username to message:");
    if (userName && userName.trim()) {
      switchToDM(userName.trim());
    }
  };

  return (
    <aside className="w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col h-full">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h2 className="text-xl font-bold text-[var(--color-text-main)] tracking-tight flex items-center">
          <svg className="w-5 h-5 mr-2 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          PDC Server
        </h2>
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="online">{username}</Badge>
          <button onClick={logout} className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">
            Disconnect
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 ml-2 pr-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Channels</h3>
            <button onClick={handleAddChannel} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" title="Join or create channel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <ul className="space-y-1">
            {rooms.length === 0 && <li className="text-sm text-[var(--color-text-muted)] italic ml-2">No channels available</li>}
            {rooms.map((room) => (
              <li key={room.name}>
                <button
                  onClick={() => joinRoom(room.name)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${activeRoom === room.name
                      ? 'bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-accent)] font-medium shadow-sm'
                      : 'border border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-base)] hover:text-[var(--color-text-main)]'
                    }`}
                >
                  <span className="opacity-50 mr-2">#</span>
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3 ml-2 pr-2">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Direct Messages</h3>
            <button onClick={handleAddUser} className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors" title="Message new user">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <ul className="space-y-1">
            {/* Safe check: ensure contacts exists before mapping */}
            {contacts && contacts.map(user => (
              <li key={user.username}>
                <button
                  onClick={() => switchToDM(user.username)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${activeRoom === `@${user.username}`
                      ? 'bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-accent)] font-medium shadow-sm'
                      : 'border border-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-base)] hover:text-[var(--color-text-main)]'
                    }`}
                >
                  <span 
                    className={`w-2 h-2 rounded-full mr-2 opacity-80 flex-shrink-0 ${
                      user.status === 'online' 
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                        : 'bg-zinc-500'
                    }`} 
                    title={user.status === 'online' ? 'Online' : 'Offline'}
                  ></span>
                  <span className="flex-1 text-left truncate">{user.username}</span>
                  {user.isFavorite && (
                    <svg className="w-3.5 h-3.5 text-yellow-500 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
            {(!contacts || contacts.length === 0) && (
              <li className="text-sm text-[var(--color-text-muted)] italic ml-2">No active conversations</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
};