import asyncio
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.api.rest import router as rest_router
from backend.core import config

# Initialize the main FastAPI application
app = FastAPI(title="PDC Chat API Bridge")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach the REST endpoints from rest.py
app.include_router(rest_router)


@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    """Bridges the React frontend to the raw TCP networking engine."""
    await websocket.accept()

    try:
        # 1. Connect to our own raw TCP server behind the scenes
        reader, writer = await asyncio.open_connection(config.TCP_HOST, config.TCP_PORT)

        # 2. Automatically perform the CONNECT handshake
        writer.write(f"CONNECT {username}\n".encode('utf-8'))
        await writer.drain()

        # 3. Background task: Listen to the TCP server and forward back to React
        async def listen_to_tcp():
            while True:
                data = await reader.read(1024)
                if not data:
                    break
                # Forward the raw server output as JSON
                await websocket.send_json({
                    "type": "message",
                    "content": data.decode('utf-8').strip()
                })

        tcp_task = asyncio.create_task(listen_to_tcp())

        # 4. Main loop: Listen to React and forward to the TCP server
        while True:
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "JOIN":
                writer.write(f"JOIN {data['room']}\n".encode('utf-8'))
            elif action == "MSG":
                writer.write(f"MSG {data['text']}\n".encode('utf-8'))
            elif action == "RAW":
                writer.write(f"{data['text']}\n".encode('utf-8'))
            elif action == "PING":
                writer.write(b"PING\n")
            elif action == "TYPING":
                writer.write(b"TYPING \n")
            elif action == "LEAVE":
                writer.write(b"LEAVE\n")
            elif action == "TYPING":
                room = data.get("room", "")
                if room:
                    writer.sendall(f"TYPING {room}\n".encode('utf-8'))

            await writer.drain()

    except WebSocketDisconnect:
        logging.info(f"React Client {username} disconnected from WebSocket.")
    except Exception as e:
        logging.error(f"WebSocket Bridge Error for {username}: {e}")
    finally:
        # Clean up the internal TCP connection
        try:
            if 'tcp_task' in locals():
                tcp_task.cancel()
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass
