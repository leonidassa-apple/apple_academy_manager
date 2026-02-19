
import os
import sys
from werkzeug.security import generate_password_hash
from database import get_db_connection

def reset_password(username, new_password):
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return

    hashed_password = generate_password_hash(new_password)
    
    cursor = conn.cursor()
    try:
        cursor.execute(f"UPDATE users SET password = %s WHERE username = %s", (hashed_password, username))
        conn.commit()
        print(f"Password for user '{username}' has been reset successfully.")
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <username> <new_password>")
        sys.exit(1)
    
    username = sys.argv[1]
    new_password = sys.argv[2]
    reset_password(username, new_password)
