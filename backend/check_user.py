
import os
import sys
from database import get_db_connection

def check_user(username):
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return

    cursor = conn.cursor()
    cursor.execute(f"SELECT id, username, role FROM users WHERE username = '{username}'")
    user = cursor.fetchone()
    
    if user:
        print(f"User found: {user}")
    else:
        print(f"User '{username}' not found.")
    
    conn.close()

if __name__ == "__main__":
    check_user("Leonidas")
