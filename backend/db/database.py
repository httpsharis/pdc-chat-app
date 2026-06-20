import sqlite3
import threading

class DatabaseManager:
    def __init__(self, db_path="chat.db"):
        self.lock = threading.Lock()
        # Keep one persistent connection open
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self._initialize_tables()

    def _initialize_tables(self):
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room TEXT,
                    sender TEXT,
                    content TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            self.conn.commit()

    def save_message(self, room, sender, content):
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO messages (room, sender, content) VALUES (?, ?, ?)",
                (room, sender, content)
            )
            self.conn.commit()

    def get_last_50(self, room):
        with self.lock:
            cursor = self.conn.cursor()
            cursor.execute(
                "SELECT sender, content FROM messages WHERE room = ? ORDER BY id DESC LIMIT 50",
                (room,)
            )
            return cursor.fetchall()[::-1]

    def get_all_users(self):
        with self.lock:
            cursor = self.conn.cursor()
            # Select distinct senders who are not 'System' or 'Me' (which might accidentally be saved)
            cursor.execute("SELECT DISTINCT sender FROM messages WHERE sender NOT IN ('System', 'Me')")
            return [row[0] for row in cursor.fetchall()]