import threading

class RoomManager:
    def __init__(self):
        # Maps room names to a set of client sockets
        self.rooms = {}
        self.lock = threading.Lock()

    def join_room(self, room_name, client_socket):
        """Adds a client to a room."""
        with self.lock:
            if room_name not in self.rooms:
                self.rooms[room_name] = set()
            self.rooms[room_name].add(client_socket)

    def leave_room(self, room_name, client_socket):
        """Removes a client from a room."""
        with self.lock:
            if room_name in self.rooms and client_socket in self.rooms[room_name]:
                self.rooms[room_name].remove(client_socket)
                # Clean up the room if it's empty
                if not self.rooms[room_name]:
                    del self.rooms[room_name]

    def broadcast_to_room(self, room_name, message, sender_socket):
        """Sends a message to everyone in the room except the sender."""
        # 1. Quickly grab a copy of the clients in the room using the lock
        with self.lock:
            if room_name not in self.rooms:
                return
            # Make a quick shallow copy of the set as a list or tuple
            clients_to_send = list(self.rooms[room_name])

        # 2. Iterate and send the data WITHOUT holding the lock
        for client in clients_to_send:
            if client != sender_socket:
                try:
                    client.send(message.encode('utf-8'))
                except Exception:
                    # If a socket is dead, we ignore it here; 
                    # the main server loop will clean it up.
                    pass