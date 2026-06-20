import os
import logging
from dotenv import load_dotenv

# Load the .env file from the root folder
load_dotenv()

# Read settings from the file
TCP_HOST = os.getenv("TCP_HOST", "127.0.0.1")
TCP_PORT = int(os.getenv("TCP_PORT", 5000))
UDP_BROADCAST_PORT = int(os.getenv("UDP_PORT", 5001))
DB_NAME = os.getenv("DB_PATH", "backend/db/chat_history.db")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)