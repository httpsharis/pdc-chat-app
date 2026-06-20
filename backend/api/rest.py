from fastapi import APIRouter
from backend.db.database import DatabaseManager

# Use APIRouter to keep endpoints modular
router = APIRouter()
db = DatabaseManager()

from backend.engine.tcp_server import clients, clients_lock

@router.get("/api/users")
async def get_users():
    """Returns a list of currently active users."""
    with clients_lock:
        return {"users": list(clients.keys())}

@router.get("/api/all_users")
async def get_all_users():
    """Returns a list of all historical users from the DB."""
    return {"users": db.get_all_users()}

@router.get("/api/rooms")
async def get_rooms():
    """Returns a list of available rooms for the React Sidebar."""
    return {"rooms": ["general", "secret", "announcements"]}

@router.get("/api/history/{room_name}")
async def get_history(room_name: str):
    """Fetches the last 50 messages for a specific room."""
    # Our get_last_50 function returns tuples: (sender, content)
    history = db.get_last_50(room_name)
    
    # Format it cleanly into JSON for the frontend
    formatted_history = [{"sender": row[0], "content": row[1]} for row in history]
    
    return {"room": room_name, "history": formatted_history}