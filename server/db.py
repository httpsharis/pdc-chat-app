import sqlite3
import threading

class DatabaseManager:
    def __init__(self, db_name="chat_history.db"):
        self.db_name = db_name
        self.lock = threading.Lock() # Crucial for thread safety
        self._init_db()

    def _init_db(self):
        """Creates the messages table if it doesn't exist yet."""
        with self.lock:
            conn = sqlite3.connect(self.db_name, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room TEXT NOT NULL,
                    sender TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            conn.close()

    def save_message(self, room, sender, content):
        """Saves a new message to the database."""
        with self.lock:
            conn = sqlite3.connect(self.db_name, check_same_thread=False)
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO messages (room, sender, content) VALUES (?, ?, ?)",
                (room, sender, content)
            )
            conn.commit()
            conn.close()

    def get_last_50(self, room):
        """Fetches the last 50 messages for a specific room."""
        with self.lock:
            conn = sqlite3.connect(self.db_name, check_same_thread=False)
            cursor = conn.cursor()
            # Order by ID descending to get the newest, then limit to 50
            cursor.execute(
                "SELECT sender, content FROM messages WHERE room = ? ORDER BY id DESC LIMIT 50", 
                (room,)
            )
            rows = cursor.fetchall()
            conn.close()
            
            # The results come back newest-first. We reverse them so they 
            # read top-to-bottom chronologically in the chat.
            return reversed(rows)