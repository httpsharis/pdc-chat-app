import threading
import uvicorn
import logging
import sys
import os

# Ensure the root directory is in the python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the TCP Server from your engine module
from backend.engine.tcp_server import start_tcp_server

# Import the FastAPI app from your api module
# (Assuming you initialized 'app = FastAPI()' inside websockets.py or rest.py)
from backend.api.websockets import app

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


def run_tcp_engine():
    """Wrapper to run the raw TCP sockets in a background thread."""
    logging.info("Initializing raw TCP Engine on port 5000...")
    start_tcp_server()


def run_fastapi_bridge():
    """Runs the modern web server in the main thread."""
    logging.info("Initializing FastAPI Bridge on port 8000...")
    # uvicorn.run blocks the main thread, keeping the application alive
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")


if __name__ == "__main__":
    print(r"""
     ____  _     _        _ _           _           _ 
    |  _ \(_)___| |_ _ __(_) |__  _   _| |_ ___  __| |
    | | | | / __| __| '__| | '_ \| | | | __/ _ \/ _` |
    | |_| | \__ \ |_| |  | | |_) | |_| | ||  __/ (_| |
    |____/|_|___/\__|_|  |_|_.__/ \__,_|\__\___|\__,_|
                 Chat Server Boot Sequence
    """)

    # 1. Fire up the TCP Engine (and your background Heartbeat Janitor) in a thread
    tcp_thread = threading.Thread(target=run_tcp_engine, daemon=True)
    tcp_thread.start()

    # 2. Fire up the modern Web API (This blocks and keeps the script running)
    try:
        run_fastapi_bridge()
    except KeyboardInterrupt:
        logging.info("Server cluster shutting down safely.")
