import React, { createContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Message, Room, User } from "../types/chat.types";

interface ChatContextType {
  username: string | null;
  setUsername: (name: string | null) => void;
  isConnected: boolean;
  activeRoom: string | null;
  setActiveRoom: (room: string | null) => void;
  rooms: Room[];
  messages: Message[];
  activeUsers: User[];
  joinRoom: (room: string) => void;
  switchToDM: (targetUser: string) => void;
  sendMessage: (text: string) => void;
  sendDM: (targetUser: string, text: string) => void;
  login: (name: string) => void;
  logout: () => void;
  error: string | null;
  contacts: User[];
  toggleFavorite: (username: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem('chat_username');
  });
  const [isConnected, setIsConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const [savedUsernames, setSavedUsernames] = useState<string[]>(() => {
    const saved = localStorage.getItem('chat_contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [favoriteUsernames, setFavoriteUsernames] = useState<string[]>(() => {
    const saved = localStorage.getItem('chat_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [historicalUsers, setHistoricalUsers] = useState<string[]>([]);

  const toggleFavorite = useCallback((name: string) => {
    if (!name) return;
    setFavoriteUsernames(prev => {
      const next = prev.includes(name) ? prev.filter(u => u !== name) : [...prev, name];
      localStorage.setItem('chat_favorites', JSON.stringify(next));
      return next;
    });
  }, []);

  const saveContact = useCallback((name: string) => {
    if (!name) return;
    setSavedUsernames(prev => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      localStorage.setItem('chat_contacts', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleIncomingMessage = useCallback((data: string) => {
    // Intercept fatal login errors and kick user back to login screen
    if (data.startsWith('ERROR:') && data.toLowerCase().includes('taken')) {
      if (wsRef.current) wsRef.current.close();
      setUsername(null);
      setIsConnected(false);
      setError("Username is currently stuck on the server. Please use a different name or restart the Python backend.");
      return;
    }

    const newMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'System',
      content: data,
      timestamp: new Date().toISOString(),
      isSystem: true,
      room: ''
    };

    if (data.startsWith('SUCCESS:')) {
      newMsg.content = data.replace('SUCCESS:', '').trim();
      if (data.includes('Joined')) setMessages([]);
    } else if (data.startsWith('ERROR:')) {
      newMsg.content = data;
    } else if (data.startsWith('ANNOUNCE:')) {
      newMsg.content = data.replace('ANNOUNCE:', '').trim();
    } else if (data.startsWith('--- Room History ---') || data.startsWith('--------------------')) {
      return;
    } else if (data.startsWith('[DM from')) {
      const match = data.match(/\[DM from (.*?)\]: (.*)/);
      if (match) {
        newMsg.sender = match[1];
        newMsg.content = match[2];
        newMsg.isSystem = false;
        newMsg.room = `@${match[1]}`;
        saveContact(match[1]);
      }
    } else if (data.startsWith('[DM to')) {
      const match = data.match(/\[DM to (.*?)\]: (.*)/);
      if (match) {
        newMsg.sender = 'Me';
        newMsg.content = match[2];
        newMsg.isSystem = false;
        newMsg.room = `@${match[1]}`;
        saveContact(match[1]);
      }
    } else {
      const match = data.match(/\[(.*?)\]: (.*)/);
      if (match) {
        newMsg.sender = match[1];
        newMsg.content = match[2];
        newMsg.isSystem = false;
      }
    }

    setMessages((prev) => [...prev, newMsg]);
  }, [saveContact]);

  // Main WebSocket Connection Hook
  useEffect(() => {
    if (!username) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${username}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      fetch("http://127.0.0.1:8000/api/rooms")
        .then((res) => res.json())
        .then((data) => {
          const fetchedRooms = data.rooms || [];
          const defaultRoom = "general";

          const roomObjects = fetchedRooms.map((r: string) => ({ name: r }));
          if (!fetchedRooms.includes("general")) {
            roomObjects.unshift({ name: "general" });
          }
          setRooms(roomObjects);

          ws.send(JSON.stringify({ action: "JOIN", room: defaultRoom }));
          setActiveRoom(defaultRoom);
        })
        .catch((err) => console.error("Failed to fetch rooms:", err));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message" && payload.content) {
          const lines = payload.content.split("\n");
          lines.forEach((line: string) => {
            if (line.trim()) handleIncomingMessage(line.trim());
          });
        }
      } catch {
        handleIncomingMessage(event.data);
      }
    };

    ws.onerror = () => {
      setError("Cannot reach server at 127.0.0.1:8000. Is the FastAPI backend running?");
    };

    ws.onclose = () => {
      setIsConnected(false);
      setUsername(null);
      setActiveRoom(null);
      setMessages([]);
      setError((prev) => prev || "Connection closed. Username may be taken.");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "LEAVE" }));
        ws.close();
      }
    };
  }, [username, handleIncomingMessage]);

  // Fetch active users list for online status
  useEffect(() => {
    if (!isConnected) return;
    const fetchUsers = () => {
      fetch("http://127.0.0.1:8000/api/users")
        .then(res => res.json())
        .then(data => {
          if (data.users) {
            // TypeScript fix applied here
            setActiveUsers(data.users.map((u: string): User => ({ username: u, status: 'online' })));
          }
        })
        .catch(err => console.error("Failed to fetch users:", err));
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 3000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Fetch all historical users once on connect
  useEffect(() => {
    if (!isConnected) return;
    fetch("http://127.0.0.1:8000/api/all_users")
      .then(res => res.json())
      .then(data => {
        if (data.users) setHistoricalUsers(data.users);
      })
      .catch(err => console.error("Failed to fetch historical users:", err));
  }, [isConnected]);

  // Actions
  const login = (name: string) => {
    setError(null);
    setUsername(name);
    localStorage.setItem('chat_username', name);
  };

  const logout = () => {
    if (wsRef.current) wsRef.current.close();
    setUsername(null);
    setError(null);
    localStorage.removeItem('chat_username');
  };

  const joinRoom = (room: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "JOIN", room }));
      setActiveRoom(room);
    }
  };

  const switchToDM = async (targetUser: string) => {
    setActiveRoom(`@${targetUser}`);
    setMessages([]);
    saveContact(targetUser);

    if (!username) return;
    const dmRoom = `DM:${[username, targetUser].sort().join(':')}`;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/history/${dmRoom}`);
      const data = await res.json();
      if (data.history) {
        setMessages(data.history.map((msg: {sender: string, content: string}) => ({
          id: Math.random().toString(36).substring(2, 9),
          sender: msg.sender === username ? 'Me' : msg.sender,
          content: msg.content,
          timestamp: new Date().toISOString(),
          isSystem: false,
          room: `@${targetUser}`
        })));
      }
    } catch (e) {
      console.error("Failed to fetch DM history:", e);
    }
  };

  const sendMessage = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (text.startsWith("/")) {
        wsRef.current.send(JSON.stringify({ action: "RAW", text: text }));
      } else {
        wsRef.current.send(JSON.stringify({ action: "MSG", text }));
        // Optimistic update
        const newMsg: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'Me',
          content: text,
          timestamp: new Date().toISOString(),
          isSystem: false,
          room: activeRoom || ''
        };
        setMessages(prev => [...prev, newMsg]);
      }
    }
  };

  const sendDM = (targetUser: string, text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "RAW", text: `DM ${targetUser} ${text}` }));
      saveContact(targetUser);
      // Optimistic update
      const newMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'Me',
        content: text,
        timestamp: new Date().toISOString(),
        isSystem: false,
        room: `@${targetUser}`
      };
      setMessages(prev => [...prev, newMsg]);
    }
  };

  // Compile contacts list with proper TypeScript checking
  const contacts: User[] = useMemo(() => {
    const activeMap = new Map(activeUsers.map(u => [u.username, u]));
    const allUsernames = new Set<string>();

    activeUsers.forEach(u => {
      if (u.username !== username) allUsernames.add(u.username);
    });

    savedUsernames.forEach(u => {
      if (u !== username) allUsernames.add(u);
    });
    
    historicalUsers.forEach(u => {
      if (u !== username) allUsernames.add(u);
    });

    // TypeScript fix applied here
    return Array.from(allUsernames).map((u): User => ({
      username: u,
      status: activeMap.has(u) ? 'online' : 'offline',
      isFavorite: favoriteUsernames.includes(u)
    })).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.status === 'online' && b.status === 'offline') return -1;
      if (a.status === 'offline' && b.status === 'online') return 1;
      return a.username.localeCompare(b.username);
    });
  }, [activeUsers, savedUsernames, historicalUsers, favoriteUsernames, username]);

  const value = {
    username,
    setUsername,
    isConnected,
    activeRoom,
    setActiveRoom,
    rooms,
    messages,
    activeUsers,
    joinRoom,
    switchToDM,
    sendMessage,
    sendDM,
    login,
    logout,
    error,
    contacts,
    toggleFavorite,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};