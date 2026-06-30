import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { Message, Room, User } from "../types/chat.types";

interface ChatContextType {
  username: string | null;
  setUsername: (name: string | null) => void;
  isConnected: boolean;
  isReconnecting: boolean;
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
  clearError: () => void;
  contacts: User[];
  toggleFavorite: (username: string) => void;
  typingUsers: Record<string, string[]>; // ADDED
  sendTyping: (room: string) => void;   // ADDED
}

// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

type DisconnectReason =
  | "intentional_logout"
  | "username_taken"
  | "server_error"
  | "network_error"
  | "disconnected"
  | "unknown";

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [username, setUsername] = useState<string | null>(() => {
    return localStorage.getItem("chat_username");
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(() => {
    return !!localStorage.getItem("chat_username");
  });
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // TYPING INDICATOR STATE
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // RECONNECT STATE
  const reconnectAttemptRef = useRef(0);

  const wsRef = useRef<WebSocket | null>(null);
  const disconnectReasonRef = useRef<DisconnectReason>("unknown");

  const [savedUsernames, setSavedUsernames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("chat_contacts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteUsernames, setFavoriteUsernames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("chat_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [historicalUsers, setHistoricalUsers] = useState<string[]>([]);

  const clearError = useCallback(() => setError(null), []);

  const toggleFavorite = useCallback((name: string) => {
    if (!name) return;
    setFavoriteUsernames((prev) => {
      const next = prev.includes(name)
        ? prev.filter((u) => u !== name)
        : [...prev, name];
      localStorage.setItem("chat_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const saveContact = useCallback((name: string) => {
    if (!name) return;
    setSavedUsernames((prev) => {
      if (prev.includes(name)) return prev;
      const next = [...prev, name];
      localStorage.setItem("chat_contacts", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleIncomingMessage = useCallback(
    (data: string) => {
      if (data.startsWith("ERROR:") && data.toLowerCase().includes("taken")) {
        disconnectReasonRef.current = "username_taken";
        return;
      }

      // TYPING INDICATOR INTERCEPT
      if (data.startsWith("TYPING_EVENT:")) {
        const parts = data.split(":");
        if (parts.length === 3) {
          const room = parts[1];
          const typingUser = parts[2].replace("\n", "");

          if (typingUser === username) return;

          const timeoutKey = `${room}:${typingUser}`;

          if (typingTimeoutsRef.current[timeoutKey]) {
            clearTimeout(typingTimeoutsRef.current[timeoutKey]);
          }

          setTypingUsers((prev) => {
            const currentTyping = prev[room] || [];
            if (!currentTyping.includes(typingUser)) {
              return { ...prev, [room]: [...currentTyping, typingUser] };
            }
            return prev;
          });

          typingTimeoutsRef.current[timeoutKey] = setTimeout(() => {
            setTypingUsers((prev) => {
              const currentTyping = prev[room] || [];
              return { ...prev, [room]: currentTyping.filter((u) => u !== typingUser) };
            });
            delete typingTimeoutsRef.current[timeoutKey];
          }, 3000);
        }
        return;
      }

      const newMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "System",
        content: data,
        timestamp: new Date().toISOString(),
        isSystem: true,
        room: "",
      };

      if (data.startsWith("SUCCESS:")) {
        newMsg.content = data.replace("SUCCESS:", "").trim();
        if (data.includes("Joined")) setMessages([]);
      } else if (data.startsWith("ERROR:")) {
        newMsg.content = data;
      } else if (data.startsWith("ANNOUNCE:")) {
        newMsg.content = data.replace("ANNOUNCE:", "").trim();
      } else if (
        data.startsWith("--- Room History ---") ||
        data.startsWith("--------------------")
      ) {
        return;
      } else if (data.startsWith("[DM from")) {
        const match = data.match(/\[DM from (.*?)\]: (.*)/);
        if (match) {
          newMsg.sender = match[1];
          newMsg.content = match[2];
          newMsg.isSystem = false;
          newMsg.room = `@${match[1]}`;
          saveContact(match[1]);
        }
      } else if (data.startsWith("[DM to")) {
        const match = data.match(/\[DM to (.*?)\]: (.*)/);
        if (match) {
          newMsg.sender = "Me";
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
    },
    [saveContact, username],
  );

    // Main WebSocket Connection Hook
  useEffect(() => {
    if (!username) return;

    disconnectReasonRef.current = "unknown";
    let isActive = true;

    const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws/${username}`);
    wsRef.current = ws;

    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let connectTimeout: ReturnType<typeof setTimeout> | null = null;

    connectTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        disconnectReasonRef.current = "network_error";
        ws.close();
      }
    }, 5000);

    ws.onopen = () => {
      if (!isActive) return;

      if (connectTimeout) clearTimeout(connectTimeout);
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptRef.current = 0;
      setError(null);

      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "PING" }));
        }
      }, 5000);

      fetch(`http://${window.location.hostname}:8000/api/rooms`)
        .then((res) => res.json())
        .then((data) => {
          if (!isActive) return;
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
        .catch(() => {
          if (!isActive) return;
          ws.send(JSON.stringify({ action: "JOIN", room: "general" }));
          setActiveRoom("general");
          setRooms([{ name: "general" }]);
        });
    };

    ws.onmessage = (incomingEvent) => {
      if (!isActive) return;

      try {
        const payload = JSON.parse(incomingEvent.data);
        if (payload.type === "message" && payload.content) {
          const lines = payload.content.split("\n");
          lines.forEach((line: string) => {
            if (line.trim()) handleIncomingMessage(line.trim());
          });
        }
      } catch {
        handleIncomingMessage(incomingEvent.data);
      }
    };

    ws.onerror = () => {
      disconnectReasonRef.current = "network_error";
    };

    ws.onclose = (closeEvent) => {
      if (!isActive) return;

      if (pingInterval) clearInterval(pingInterval);
      if (connectTimeout) clearTimeout(connectTimeout);

      setIsConnected(false);
      wsRef.current = null;

      let reason: DisconnectReason = disconnectReasonRef.current;

      if (reason === "unknown") {
        if (!closeEvent.wasClean) {
          reason = "network_error";
        } else {
          reason = "disconnected";
        }
      }

      switch (reason) {
        case "intentional_logout": {
          setUsername(null);
          setActiveRoom(null);
          setMessages([]);
          setIsReconnecting(false);
          setError(null);
          break;
        }

        case "username_taken": {
          setUsername(null);
          setActiveRoom(null);
          setMessages([]);
          setIsReconnecting(false);
          setError("username_taken");
          localStorage.removeItem("chat_username");
          break;
        }

        default: {
          // AUTO-RECONNECT LOGIC
          setIsReconnecting(true);
          const attempt = reconnectAttemptRef.current;
          const backoff = Math.min(1000 * Math.pow(1.5, attempt), 10000);

          setTimeout(() => {
            const currentName = username;
            setUsername(null);
            setTimeout(() => {
              if (currentName) setUsername(currentName);
            }, 50);
            reconnectAttemptRef.current += 1;
          }, backoff);
          break;
        }
      }
    };

    return () => {
      isActive = false;
      if (pingInterval) clearInterval(pingInterval);
      if (connectTimeout) clearTimeout(connectTimeout);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [username, handleIncomingMessage]);

  // Fetch active users list for online status
  useEffect(() => {
    if (!isConnected) return;

    let isActive = true;

    const fetchUsers = () => {
      fetch(`http://${window.location.hostname}:8000/api/users`)
        .then((res) => res.json())
        .then((data) => {
          if (!isActive) return;
          if (data.users) {
            setActiveUsers(
              data.users.map(
                (u: string): User => ({ username: u, status: "online" }),
              ),
            );
          }
        })
        .catch((err) => console.error("Failed to fetch users:", err));
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 3000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [isConnected]);

  // Fetch all historical users once on connect
  useEffect(() => {
    if (!isConnected) return;

    let isActive = true;

    fetch(`http://${window.location.hostname}:8000/api/all_users`)
      .then((res) => res.json())
      .then((data) => {
        if (!isActive) return;
        if (data.users) setHistoricalUsers(data.users);
      })
      .catch((err) => console.error("Failed to fetch historical users:", err));

    return () => {
      isActive = false;
    };
  }, [isConnected]);

  // Actions
  const login = (name: string) => {
    setError(null);
    disconnectReasonRef.current = "unknown";
    setIsReconnecting(true);
    localStorage.setItem("chat_last_username", name);
    setUsername(name);
    localStorage.setItem("chat_username", name);
  };

  const logout = () => {
    disconnectReasonRef.current = "intentional_logout";

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ action: "LEAVE" }));
      } catch {
        // Ignore send errors during logout
      }
      wsRef.current.close();
    }

    setUsername(null);
    setError(null);
    localStorage.removeItem("chat_username");
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
    const dmRoom = `DM:${[username, targetUser].sort().join(":")}`;
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/api/history/${dmRoom}`);
      const data = await res.json();
      if (data.history) {
        setMessages(
          data.history.map((msg: { sender: string; content: string }) => ({
            id: Math.random().toString(36).substring(2, 9),
            sender: msg.sender === username ? "Me" : msg.sender,
            content: msg.content,
            timestamp: new Date().toISOString(),
            isSystem: false,
            room: `@${targetUser}`,
          })),
        );
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
        const newMsg: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: "Me",
          content: text,
          timestamp: new Date().toISOString(),
          isSystem: false,
          room: activeRoom || "",
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    }
  };

  const sendDM = (targetUser: string, text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "RAW", text: `DM ${targetUser} ${text}` }),
      );
      saveContact(targetUser);
      const newMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "Me",
        content: text,
        timestamp: new Date().toISOString(),
        isSystem: false,
        room: `@${targetUser}`,
      };
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  // ADDED: Typing Action
  const sendTyping = useCallback((room: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && room) {
      wsRef.current.send(JSON.stringify({ action: "TYPING", room }));
    }
  }, []);

  // Compile contacts list
  const contacts: User[] = useMemo(() => {
    const activeMap = new Map(activeUsers.map((u) => [u.username, u]));
    const allUsernames = new Set<string>();

    activeUsers.forEach((u) => {
      if (u.username !== username) allUsernames.add(u.username);
    });

    savedUsernames.forEach((u) => {
      if (u !== username) allUsernames.add(u);
    });

    historicalUsers.forEach((u) => {
      if (u !== username) allUsernames.add(u);
    });

    return Array.from(allUsernames)
      .map(
        (u): User => ({
          username: u,
          status: activeMap.has(u) ? "online" : "offline",
          isFavorite: favoriteUsernames.includes(u),
        }),
      )
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        if (a.status === "online" && b.status === "offline") return -1;
        if (a.status === "offline" && b.status === "online") return 1;
        return a.username.localeCompare(b.username);
      });
  }, [
    activeUsers,
    savedUsernames,
    historicalUsers,
    favoriteUsernames,
    username,
  ]);

  const value = {
    username,
    setUsername,
    isConnected,
    isReconnecting,
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
    clearError,
    contacts,
    toggleFavorite,
    typingUsers,
    sendTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};