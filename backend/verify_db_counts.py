
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Postgres Config
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')
PG_DB = os.getenv('PG_NAME', 'apple_academy')
PG_PORT = int(os.getenv('PG_PORT', 5432))

TABLES = [
    'users',
    'alunos',
    'devices',
    'tipos_devices',
    'emprestimos',
    'equipment_control',
    'eventos',
    'livros',
    'exemplares',
    'inventory'
]

def verify_counts():
    print("📊 Database Content Analysis")
    print("-" * 30)
    
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB,
            port=PG_PORT
        )
        cursor = conn.cursor()
        
        total_rows = 0
        
        print(f"{'Table':<20} | {'Count':<10}")
        print("-" * 30)
        
        for table in TABLES:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"{table:<20} | {count:<10}")
                total_rows += count
            except psycopg2.errors.UndefinedTable:
                print(f"{table:<20} | {'NOT FOUND':<10}")
                conn.rollback()
        
        print("-" * 30)
        print(f"Total Records Verified: {total_rows}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")

if __name__ == '__main__':
    verify_counts()
