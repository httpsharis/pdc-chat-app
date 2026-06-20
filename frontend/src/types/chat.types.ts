export interface Message {
  id: string;
  room?: string;
  sender: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface User {
  username: string;
  status: 'online' | 'offline';
  isFavorite?: boolean;
}

export interface Room {
  name: string;
}

export interface ChatContextType {
  username: string | null;
  setUsername: (name: string | null) => void;
  isConnected: boolean;
  activeRoom: string | null;
  setActiveRoom: (room: string | null) => void;
  rooms: Room[];
  messages: Message[];
  activeUsers: User[];
  contacts: User[];
  toggleFavorite: (username: string) => void;
  joinRoom: (room: string) => void;
  sendMessage: (text: string) => void;
  sendDM: (user: string, text: string) => void;
  login: (username: string) => void;
  logout: () => void;
}
