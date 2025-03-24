import sqlite3
from config.config import Config

def get_db():
    """
    Create and yield a new database connection for each request.
    This is used as a FastAPI dependency.
    
    Using check_same_thread=False allows SQLite to be used across threads,
    which is safe as long as we're careful about connection management.
    Each request gets its own connection.
    """
    db_path = Config.get_db_path()
    # Important: Don't close the connection until the request is done
    # check_same_thread=False allows SQLite to be used across threads
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    
    # In a test context, we need to make sure the connection stays open
    # while we execute queries
    return conn 