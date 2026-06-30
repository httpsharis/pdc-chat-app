import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sqlite3

app = FastAPI()

# 1. REST Endpoint: Get all available rooms
@app.get("/api/rooms")
async def get_rooms():
    return {"rooms": ["general", "secret", "announcements"]}

# 2. REST Endpoint: Get history for a specific room
@app.get("/api/history/{room_name}")
async def get_history(room_name: str):
    conn = sqlite3.connect("server/chat_history.db")
    cursor = conn.cursor()
    cursor.execute("SELECT sender, content, timestamp FROM messages WHERE room = ? ORDER BY id DESC LIMIT 50", (room_name,))
    rows = cursor.fetchall()
    conn.close()
    
    return {"room": room_name, "history": [{"sender": r[0], "content": r[1], "timestamp": r[2]} for r in rows]}

# 3. WebSocket Endpoint: Real-time chat connection for React
@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()

    try:
        # Step A: Connect to your raw TCP server behind the scenes
        reader, writer = await asyncio.open_connection('127.0.0.1', 5000)

        # Step B: Automatically perform the CONNECT handshake
        writer.write(f"CONNECT {username}\n".encode('utf-8'))
        await writer.drain()

        # Step C: Background task to listen to the TCP server and forward to React
        async def listen_to_tcp():
            while True:
                data = await reader.read(1024)
                if not data:
                    break
                # Forward the raw server output directly to the React frontend
                await websocket.send_json({"type": "message", "content": data.decode('utf-8').strip()})

        # Start the background listener
        tcp_listener_task = asyncio.create_task(listen_to_tcp())

        # Step D: Listen to React and forward to the TCP server
        while True:
            # React will send data like: {"action": "JOIN", "room": "general"}
            data = await websocket.receive_json()
            
            if data["action"] == "JOIN":
                writer.write(f"JOIN {data['room']}\n".encode('utf-8'))
            elif data["action"] == "MSG":
                writer.write(f"MSG {data['text']}\n".encode('utf-8'))
            elif data["action"] == "LEAVE":
                writer.write(b"LEAVE\n")
            elif data["action"] == "TYPING":
                writer.write(f"TYPING {data['room']}\n".encode('utf-8'))
            elif data["action"] == "RAW":
                writer.write(f"{data['text']}\n".encode('utf-8'))
            
            await writer.drain()

    except WebSocketDisconnect:
        print(f"React Client {username} disconnected")
    except Exception as e:
        print(f"Bridge Error: {e}")
    finally:
        # Clean up the internal connection
        try:
            if 'tcp_listener_task' in locals():
                tcp_listener_task.cancel()
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass