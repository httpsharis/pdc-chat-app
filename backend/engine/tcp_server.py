import socket
import threading
import time
from backend.core.logger import print_server_dashboard
from backend.engine.room_manager import RoomManager
from backend.engine.federation import sync_message_to_peers
from backend.db.database import DatabaseManager
from backend.engine.udp_caster import send_announcement

# Global State
clients = {}
clients_lock = threading.Lock()
room_manager = RoomManager()
db = DatabaseManager()

def handle_client(client_socket, addr):
    username = None
    current_room = None
    
    try:
        while True:
            data = client_socket.recv(1024)
            if not data:
                break
                
            command = data.decode('utf-8').strip()
            if not command:
                continue
                
            if command.startswith("CONNECT "):
                proposed_username = command[8:].strip()
                with clients_lock:
                    if proposed_username in clients:
                        old_sock = clients[proposed_username]["socket"]
                        try:
                            old_sock.send(b"ERROR: Session taken over by another location.\n")
                            old_sock.close()
                        except Exception:
                            pass
                    username = proposed_username
                    clients[username] = {"socket": client_socket, "last_active": time.time()}
                client_socket.send(b"SUCCESS: Connected.\n")
                send_announcement(f"{username} has joined the server.")
                
            elif command.startswith("JOIN "):
                if current_room:
                    room_manager.leave_room(current_room, client_socket)
                current_room = command[5:].strip()
                room_manager.join_room(current_room, client_socket)
                client_socket.send(f"SUCCESS: Joined {current_room}.\n".encode('utf-8'))
                
                # Fetch history
                history = db.get_last_50(current_room)
                if history:
                    client_socket.send(b"--- Room History ---\n")
                    for sender, content in history:
                        client_socket.send(f"[{sender}]: {content}\n".encode('utf-8'))
                    client_socket.send(b"--------------------\n")
                
            elif command.startswith("MSG "):
                if current_room and username:
                    message_text = command[4:]
                    formatted_msg = f"[{username}]: {message_text}\n"
                    
                    # Save to DB
                    db.save_message(current_room, username, message_text)
                    
                    # 1. Broadcast locally
                    room_manager.broadcast_to_room(current_room, formatted_msg, client_socket)
                    
                    # 2. Sync to cluster
                    sync_message_to_peers(current_room, formatted_msg)
                    
            elif command.startswith("DM "):
                parts = command.split(" ", 2)
                if len(parts) >= 3 and username:
                    target_user = parts[1]
                    dm_text = parts[2]
                    
                    # Save DM to DB
                    dm_room = f"DM:{':'.join(sorted([username, target_user]))}"
                    db.save_message(dm_room, username, dm_text)

                    with clients_lock:
                        if target_user in clients:
                            target_sock = clients[target_user]["socket"]
                            try:
                                target_sock.send(f"[DM from {username}]: {dm_text}\n".encode('utf-8'))
                                client_socket.send(b"SUCCESS: DM sent.\n")
                            except Exception:
                                client_socket.send(f"ERROR: Could not send DM to {target_user}.\n".encode('utf-8'))
                        else:
                            client_socket.send(b"SUCCESS: DM sent (User offline).\n")

            elif command == "LIST ROOMS":
                rooms = list(room_manager.rooms.keys())
                rooms_list = ", ".join(rooms) if rooms else "No active rooms."
                client_socket.send(f"Active Rooms: {rooms_list}\n".encode('utf-8'))

            elif command.startswith("/kick "):
                target_user = command[6:].strip()
                # For simplicity, anyone can kick. In a real app, verify admin status.
                with clients_lock:
                    if target_user in clients:
                        target_sock = clients[target_user]["socket"]
                        try:
                            target_sock.send(b"You have been kicked by an admin.\n")
                            target_sock.close()
                        except Exception:
                            pass
                        client_socket.send(f"SUCCESS: {target_user} kicked.\n".encode('utf-8'))
                    else:
                        client_socket.send(f"ERROR: {target_user} not found.\n".encode('utf-8'))

            elif command == "LEAVE":
                if current_room:
                    room_manager.leave_room(current_room, client_socket)
                    current_room = None
                    client_socket.send(b"SUCCESS: Left room.\n")
                    
            elif command == "QUIT":
                break
                
    except Exception as e:
        print(f"Error handling client {addr}: {e}")
    finally:
        if current_room:
            room_manager.leave_room(current_room, client_socket)
        if username:
            with clients_lock:
                if username in clients:
                    del clients[username]
            send_announcement(f"{username} has left the server.")
        client_socket.close()

def presence_monitor():
    last_users = None
    while True:
        time.sleep(2)
        with clients_lock:
            active_users = list(clients.keys())
        
        # Only redraw the dashboard if the user state changed
        if active_users != last_users:
            print_server_dashboard(active_users)
            last_users = active_users.copy()

def start_tcp_server(host='127.0.0.1', port=5000):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((host, port))
    server.listen(100)
    
    # Start the UI/Monitor thread
    threading.Thread(target=presence_monitor, daemon=True).start()
    
    while True:
        client_sock, addr = server.accept()
        threading.Thread(target=handle_client, args=(client_sock, addr), daemon=True).start()