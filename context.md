# PDC Chat App - Complete Codebase Context

This document provides an exhaustive, file-by-file breakdown of the entire PDC Chat App repository, including its frontend, backend, database, and client implementations. 

The application uses a **hybrid architecture** combining a low-level Python TCP engine for real-time messaging with a FastAPI bridge to expose data to a modern React (Vite) frontend.

---

## 📂 Root Directory

- **`main.py`** *(located inside backend, but acts as entry)*: The boot sequence. It spins up the raw TCP Engine on a background thread and the FastAPI server on the main thread.
- **`chat.db`**: The SQLite database file dynamically generated to store chat messages and room history.
- **`requirements.txt`**: Python dependencies required for the backend (FastAPI, uvicorn, etc).
- **`.env`**: Environment variables (e.g., host and port definitions).
- **`README.md`**: Project startup instructions and overview.

---

## 🐍 Backend (`/backend`)

The Python backend is divided into logical submodules.

### 1. `/backend/engine/` (Core Networking)
This folder contains the low-level, multi-threaded TCP server logic.
- **`tcp_server.py`**: The heart of the application. Listens on a raw TCP socket (port 5000). Handles thread-per-client connections and parses protocol commands (`CONNECT`, `JOIN`, `MSG`, `DM`, `/kick`, `LEAVE`, `QUIT`). 
- **`room_manager.py`**: A thread-safe data structure (using locks) that keeps track of which connected client sockets belong to which chat rooms.
- **`udp_caster.py`**: Sends UDP broadcast packets to the local subnet to announce when users connect or disconnect.
- **`federation.py`**: *(For future scalability)* Scaffolding for connecting multiple chat servers together in a distributed network.

### 2. `/backend/api/` (Web Bridge)
This folder exposes the low-level TCP engine to modern web apps.
- **`websockets.py`**: The FastAPI WebSocket endpoint (`/ws/{username}`). When a React client connects here, this script secretly opens a raw TCP connection to `tcp_server.py` and translates JSON messages into raw byte strings and vice versa. It includes CORS middleware to allow the React frontend to communicate with it.
- **`rest.py`**: Standard HTTP REST endpoints. Includes `GET /api/rooms` to fetch active channels and `GET /api/history/{room_name}` to fetch historical messages from the database.
- **`bridge.py`**: An older, deprecated bridge script (kept for legacy reasons or pending complete removal).

### 3. `/backend/db/` (Persistence)
- **`database.py`**: The `DatabaseManager` class. Manages a thread-safe connection to `chat.db` (SQLite). It creates the schemas, inserts new `MSG` events into the database, and fetches the last 50 messages for users joining a room.
- **`chat_history.db`**: An older SQLite file (can be ignored, `chat.db` is the active one).

### 4. `/backend/core/` (Utilities & Config)
- **`config.py`**: Centralized configuration constants (Host IPs, Port numbers).
- **`logger.py`**: Uses the `rich` library to print formatted, colorful tables and logs to the server console, acting as a real-time server dashboard.

---

## ⚛️ Frontend (`/frontend`)

A modern web application built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS v4**.

### 1. Configuration Files
- **`package.json` & `package-lock.json`**: NPM dependencies and build scripts.
- **`vite.config.ts`**: Vite bundler configuration.
- **`tsconfig.json`** (and related): TypeScript compilation rules.
- **`index.html`**: The root HTML file where the React app mounts.
- **`eslint.config.js`**: Linter settings to ensure clean code.

### 2. `/frontend/src/` (React Source Code)
- **`main.tsx`**: The React entry point. Mounts the `<App />` to the DOM.
- **`App.tsx`**: The root component. Wraps the app in the `ChatProvider` context and determines whether to show the `LoginScreen` or the `ChatLayout`.
- **`index.css`**: The global stylesheet. Contains the Tailwind CSS v4 import, CSS variables for the dark mode color scheme (Zinc + Violet), and custom scrollbar/animation CSS classes.
- **`App.css`**: Legacy boilerplate Vite CSS (unused).

### 3. `/frontend/src/context/` (State Management)
- **`ChatContext.tsx`**: The "Brain" of the frontend. It manages the actual WebSocket connection to the Python backend. It handles auto-joining default rooms, parsing incoming server strings into message objects, and holding the global state (current user, room list, message list).

### 4. `/frontend/src/components/chat/` (Feature Components)
- **`LoginScreen.tsx`**: The beautiful glassmorphism entry screen where users type their username.
- **`ChatLayout.tsx`**: The main structural wrapper. Places the Sidebar on the left and the Chat area on the right.
- **`Sidebar.tsx`**: Displays the active `username`, a disconnect button, and the list of available rooms mapped from the context.
- **`MessageList.tsx`**: Renders the array of messages. Uses logic to align DMs to the right and public messages to the left. Auto-scrolls to the bottom when new messages arrive.
- **`MessageInput.tsx`**: The text area and send button. intercepts text to send standard messages or parse local commands (like `/dm user msg`).

### 5. `/frontend/src/components/ui/` (Design System)
- **`Button.tsx`**: Reusable button with variants (primary, secondary, ghost) and hover effects.
- **`Input.tsx`**: Reusable text input with focus rings and glass backdrops.
- **`Badge.tsx`**: Small pill-shaped indicators (e.g., showing a green dot for "Online" status).

### 6. `/frontend/src/hooks/` and `types/`
- **`useChat.ts`**: A custom hook (`useChat()`) that provides easy access to the `ChatContext` without needing to import `useContext` everywhere.
- **`chat.types.ts`**: TypeScript definitions for `Message`, `Room`, `User`, and `ChatContextType`.

---

## 💻 Client (`/client`)

- **`client.py`**: A raw command-line interface (CLI) Python script. It uses standard socket programming to connect directly to the raw TCP engine (port 5000), bypassing the web bridge entirely. It contains two threads: one for receiving messages from the server, and one for capturing user keyboard input to send to the server. Useful for debugging backend socket logic directly.
