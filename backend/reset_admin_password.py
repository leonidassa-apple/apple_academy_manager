
import os
import psycopg2
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

# Postgres Config
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')
PG_DB = os.getenv('PG_NAME', 'apple_academy')
PG_PORT = int(os.getenv('PG_PORT', 5432))

def reset_password():
    print("🔄 Resetting admin password...")
    
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB,
            port=PG_PORT
        )
        cursor = conn.cursor()
        
        new_password = 'admin' # Default fallback
        hashed_password = generate_password_hash(new_password)
        
        # Check if admin exists
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        if cursor.fetchone():
            cursor.execute("UPDATE users SET password = %s WHERE username = 'admin'", (hashed_password,))
            print(f"✅ Password for 'admin' updated to '{new_password}'")
        else:
            print("⚠️ User 'admin' not found. Creating...")
            cursor.execute("INSERT INTO users (username, password, role) VALUES ('admin', %s, 'admin')", (hashed_password,))
            print(f"✅ User 'admin' created with password '{new_password}'")
            
        conn.commit()
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")

if __name__ == '__main__':
    reset_password()
