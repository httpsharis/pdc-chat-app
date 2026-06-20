import socket
import threading
from room_manager import RoomManager
from broadcast import send_announcement
from db import DatabaseManager

HOST = '127.0.0.1'
PORT = 5000

clients = {}
clients_lock = threading.Lock()
room_manager = RoomManager()
db = DatabaseManager()

def handle_client(client_socket, client_address):
    print(f"[+] Connection initialized from {client_address}")
    username = None
    current_room = None  # Track where the user currently is

    try:
        # 1. THE HANDSHAKE
        initial_message = client_socket.recv(1024).decode('utf-8').strip()
        if initial_message.startswith("CONNECT "):
            proposed_username = initial_message[8:]
            with clients_lock:
                if proposed_username in clients:
                    client_socket.send(b"ERROR: Username taken.\n")
                    client_socket.close()
                    return
                else:
                    username = proposed_username
                    clients[username] = client_socket
                    client_socket.send(f"SUCCESS: Welcome {username}!\n".encode('utf-8'))

                    # Fire off the UDP broadcast to everyone
                    send_announcement(f"{username} has joined the server!")
        else:
            client_socket.send(b"ERROR: Send CONNECT <username> first.\n")
            client_socket.close()
            return

        # 2. THE COMMAND LOOP
        while True:
            message = client_socket.recv(1024)
            if not message:
                break

            decoded_msg = message.decode('utf-8').strip()

            # Parse commands
            if decoded_msg.startswith("JOIN "):
                room_name = decoded_msg[5:]
                if current_room:
                    room_manager.leave_room(current_room, client_socket)
                room_manager.join_room(room_name, client_socket)
                current_room = room_name
                client_socket.send(f"[*] Joined room: {room_name}\n".encode('utf-8'))

                # Fetch and send chat history
                history = db.get_last_50(room_name)
                for past_sender, past_content in history:
                    client_socket.send(f"[{room_name}] {past_sender}: {past_content}\n".encode('utf-8'))
                    
            elif decoded_msg.startswith("MSG ") and current_room:
                # Extract the text after "MSG "
                chat_text = decoded_msg[4:]
                formatted_msg = f"[{current_room}] {username}: {chat_text}\n"
                room_manager.broadcast_to_room(current_room, formatted_msg, client_socket)

                # Save the message to the database
                db.save_message(current_room, username, chat_text)

            elif decoded_msg == "LEAVE" and current_room:
                room_manager.leave_room(current_room, client_socket)
                client_socket.send(f"[*] Left room: {current_room}\n".encode('utf-8'))
                current_room = None

            else:
                client_socket.send(b"ERROR: Unknown command or not in a room.\n")

    except ConnectionResetError:
        pass

    finally:
        # CLEANUP
        if current_room:
            room_manager.leave_room(current_room, client_socket)
        if username:
            with clients_lock:
                if username in clients:
                    del clients[username]
            print(f"[-] {username} disconnected.")

            # Fire off the UDP broadcast to everyone
            send_announcement(f"{username} has left the server.")
        client_socket.close()

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"[*] Server listening on {HOST}:{PORT}")

    try:
        while True:
            client_socket, client_address = server.accept()
            thread = threading.Thread(
                target=handle_client, args=(client_socket, client_address))
            thread.start()
    except KeyboardInterrupt:
        print("\n[*] Shutting down server.")
        server.close()

if __name__ == "__main__":
    start_server()