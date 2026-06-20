import socket
import threading
import sys

def receive_messages(sock):
    """Listens for incoming messages from the server."""
    while True:
        try:
            message = sock.recv(1024).decode('utf-8')
            if not message:
                print("\n[-] Disconnected from server.")
                sock.close()
                sys.exit(0)
            
            # Print the message and then the prompt again
            print(f"\r{message}")
            print("You: ", end="", flush=True)
            
        except Exception:
            print("\n[-] Connection lost.")
            sock.close()
            sys.exit(0)

def start_client():
    # Abstract the protocol from the user
    username = input("Enter your username: ").strip()
    if not username:
        print("[!] Username cannot be empty.")
        return
        
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        client_socket.connect(('127.0.0.1', 5000))
    except Exception as e:
        print(f"[!] Could not connect to server: {e}")
        return
    
    # Send the auto-handshake
    handshake_packet = f"CONNECT {username}\n"
    client_socket.send(handshake_packet.encode('utf-8'))
    
    # Wait for SUCCESS message from server
    response = client_socket.recv(1024).decode('utf-8')
    print(response.strip())
    if "SUCCESS" not in response:
        print("[!] Handshake failed.")
        client_socket.close()
        return

    # Start the listening thread
    receive_thread = threading.Thread(target=receive_messages, args=(client_socket,))
    receive_thread.daemon = True
    receive_thread.start()

    print("[*] Start typing commands (e.g., JOIN <room>, MSG <text>, DM <user> <text>).")
    
    # The Sending Loop
    while True:
        try:
            msg = input("You: ")
            if msg.strip().upper() == "QUIT":
                client_socket.send(b"QUIT\n")
                break
            client_socket.send(f"{msg}\n".encode('utf-8'))
        except KeyboardInterrupt:
            client_socket.send(b"QUIT\n")
            break

    client_socket.close()

if __name__ == "__main__":
    start_client()