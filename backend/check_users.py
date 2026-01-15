from app import app, get_db_connection, get_db_cursor
from werkzeug.security import generate_password_hash, check_password_hash

with app.app_context():
    conn = get_db_connection()
    cursor = get_db_cursor(conn)
    
    # Check users
    cursor.execute("SELECT id, username, password, role FROM users")
    users = cursor.fetchall()
    
    print("--- USERS ---")
    for u in users:
        print(f"User: {u['username']}, Role: {u['role']}")
        # Verify default password '123'
        is_valid = check_password_hash(u['password'], '123')
        print(f"  Password '123' valid? {is_valid}")
        
    conn.close()
