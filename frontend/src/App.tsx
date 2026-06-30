import React, { useState, useEffect } from 'react';
import { ChatProvider } from './context/ChatContext';
import { useChat } from './hooks/useChat';
import { LoginScreen } from './components/chat/LoginScreen';
import { ChatLayout } from './components/chat/ChatLayout';

// This component decides which screen to show
const MainView: React.FC = () => {
  const { username, isConnected, isReconnecting } = useChat();
  
  if (username && (isConnected || isReconnecting)) {
    return <ChatLayout />;
  }
  
  return <LoginScreen />;
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Handle the CSS theme switching
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <ChatProvider>
      {/* Floating Theme Toggle Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] shadow-sm transition-colors cursor-pointer"
        title="Toggle Theme"
      >
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      {/* The actual chat application */}
      <MainView />
    </ChatProvider>
  );
}