import threading
import logging
import socket

class RoomManager:
    def __init__(self):
        # Maps room names to a Set of client sockets
        # Example: {"general": {socket1, socket2}, "secret": {socket3}}
        self.rooms: dict[str, set[socket.socket]] = {}
        self.lock = threading.Lock()

    def join_room(self, room_name: str, client_socket: socket.socket) -> None:
        """Adds a client socket to a specific room."""
        with self.lock:
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
            self.rooms[room_name].add(client_socket)
        logging.debug(f"Socket subscribed to room: {room_name}")

    def leave_room(self, room_name: str, client_socket: socket.socket) -> None:
        """Removes a client from a room and cleans up memory if empty."""
        with self.lock:
            if room_name in self.rooms and client_socket in self.rooms[room_name]:
                self.rooms[room_name].remove(client_socket)
                
                # Garbage Collection: If the room is now empty, delete it
                if not self.rooms[room_name]:
                    del self.rooms[room_name]

    def broadcast_to_room(self, room_name: str, message: str, sender_socket: socket.socket | None) -> None:
        """Sends a message to everyone in the room EXCEPT the sender."""
        
        # Step A: Quickly grab a copy of the users while holding the lock
        with self.lock:
            if room_name not in self.rooms:
                return
            # We cast the Set to a List to create a fast shallow copy
            clients_to_send = list(self.rooms[room_name])

        # Step B: Send the data WITHOUT holding the lock
        for client in clients_to_send:
            if client != sender_socket:
                try:
                    client.send(message.encode('utf-8'))
                except Exception:
                    # If a socket is dead, we ignore it here. 
                    # The main server Janitor thread will clean it up later.
                    pass