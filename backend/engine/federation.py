import socket
import time
import logging
from backend.core import config
from backend.engine.room_manager import RoomManager

# Tracks connected sibling servers
peer_nodes = [] 

def connect_to_peer_node(peer_port: int, room_manager: RoomManager):
    """Background thread that connects this server to another server node."""
    while True:
        try:
            peer_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            peer_socket.connect((config.TCP_HOST, peer_port))
            
            # Identify as a server, not a user
            peer_socket.send(b"FEDERATION_NODE\n")
            peer_nodes.append(peer_socket)
            logging.info(f"Successfully federated with Peer Node on port {peer_port}")
            
            # Keep listening to the peer server for SYNC messages
            while True:
                data = peer_socket.recv(1024)
                if not data:
                    break
                
                decoded_msg = data.decode('utf-8').strip()
                if decoded_msg.startswith("SYNC "):
                    # Format: SYNC room_name [room_name] Username: Message
                    parts = decoded_msg.split(" ", 2)
                    if len(parts) >= 3:
                        room_name = parts[1]
                        actual_message = parts[2] + "\n"
                        # Broadcast locally, but DO NOT re-sync to prevent infinite loops
                        room_manager.broadcast_to_room(room_name, actual_message, None)
                        
        except Exception:
            logging.warning(f"Peer Node on port {peer_port} offline. Retrying in 5s...")
            time.sleep(5)

def sync_message_to_peers(room_name: str, formatted_msg: str):
    """Pushes a user's message out to all other connected servers in the cluster."""
    sync_payload = f"SYNC {room_name} {formatted_msg}"
    for peer in peer_nodes:
        try:
            peer.send(sync_payload.encode('utf-8'))
        except Exception:
            pass