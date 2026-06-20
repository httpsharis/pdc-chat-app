**Markdown**

```
# Distributed Chat Application

**Course:** Parallel and Distributed Computing (PDC) — Module 3
**Developer:** Muhammad Haris

## Project Overview
A multi-threaded, distributed chat application simulating real-time communication platforms (like Slack or IRC). Built entirely with Python's low-level networking primitives, this project demonstrates concurrent connection handling, message routing, room isolation, and broadcast announcements.

## Features
* **Multi-threaded TCP Server:** Handles multiple concurrent client connections using a thread-per-client model without blocking.
* **Room Management System:** Users can isolate conversations by joining specific rooms. Messages are routed only to subscribers of that room.
* **UDP Broadcast Announcements:** Employs a separate UDP socket (`SOCK_DGRAM`) to instantly blast server-wide events (like users joining or leaving) to all connected clients.
* **SQLite Persistence:** Chat history is saved to a thread-safe local database. Upon joining a room, users instantly receive the last 50 messages.
* **Professional Terminal Client:** A dual-threaded CLI client that cleanly separates incoming messages from user typing input.

## Architecture
The backend follows a modular, separation-of-concerns architecture:
* `server.py`: Core TCP socket binding, connection acceptance loop, and routing.
* `room_manager.py`: Manages room states, user isolation, and localized message broadcasting.
* `broadcast.py`: Handles the UDP `SOCK_DGRAM` connection for server-wide blasts.
* `db.py`: Thread-safe SQLite database manager for chat persistence.
* `client.py`: The user-facing terminal interface.

## Setup & Installation
This project relies entirely on Python's built-in libraries (`socket`, `threading`, `sqlite3`). No external dependencies or `pip install` commands are required.

### 1. Start the Server
Open a terminal and navigate to the server directory:
```bash
cd server
python server.py
```

The server will initialize on `127.0.0.1:5000` and automatically create the `chat_history.db` file.

### 2. Connect a Client

Open a *separate* terminal window and navigate to the client directory:

**Bash**

```
cd client
python client.py
```

*Note: To test concurrent connections, open multiple terminal windows and run the client script in each.*

## Chat Commands

Once the client is running, use the following strict protocol commands:

* `CONNECT <username>` — Register your username with the server (Required before chatting).
* `JOIN <room_name>` — Enter a chat room (e.g., `JOIN general`).
* `MSG <text>` — Send a message to everyone in your current room.
* `LEAVE` — Exit your current room.
* `QUIT` — Disconnect from the server and close the client.
