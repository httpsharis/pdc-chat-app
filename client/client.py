import socket
import threading
import sys

HOST = '127.0.0.1'
PORT = 5000

def receive_messages(sock):
    """Listens for incoming messages from the server."""
    while True:
        try:
            message = sock.recv(1024).decode('utf-8')
            if not message:
                print("\n[-] Disconnected from server.")
                sock.close()
                sys.exit(0)
            
            # Print the message, then reprint the input prompt so it doesn't get buried
            print(f"\r{message}")
            print("You: ", end="", flush=True)
            
        except Exception:
            print("\n[-] Connection lost.")
            sock.close()
            sys.exit(0)

def start_client():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        client_socket.connect((HOST, PORT))
    except Exception as e:
        print(f"[!] Could not connect to server: {e}")
        return

    # Start the listening thread
    receive_thread = threading.Thread(target=receive_messages, args=(client_socket,))
    receive_thread.daemon = True
    receive_thread.start()

    print("[*] Connected to server! Start typing commands (e.g., CONNECT <name>, JOIN <room>, MSG <text>).")
    
    # The Sending Loop
    while True:
        try:
            msg = input("You: ")
            if msg.strip() == "QUIT":
                break
            client_socket.send(msg.encode('utf-8'))
        except KeyboardInterrupt:
            break

    client_socket.close()

if __name__ == "__main__":
    start_client()