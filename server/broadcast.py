import socket

# We use a different port than TCP so they don't collide
BROADCAST_PORT = 5001

def send_announcement(message):
    """Sends a server-wide announcement via UDP multicast/broadcast."""
    # Initialize the socket: IPv4 (AF_INET) and UDP (SOCK_DGRAM)
    udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    
    # We must explicitly tell the OS to allow broadcast packets
    udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    
    # Format the message exactly as the syllabus requires
    formatted_message = f"ANNOUNCE: {message}\n"
    
    try:
        # Blast it to the local broadcast address
        udp_socket.sendto(formatted_message.encode('utf-8'), ('<broadcast>', BROADCAST_PORT))
    except Exception as e:
        print(f"[!] Broadcast failed: {e}")
    finally:
        # Clean up
        udp_socket.close()