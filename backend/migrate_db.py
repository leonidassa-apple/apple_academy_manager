
import os
import mysql.connector
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import time

load_dotenv()

# MySQL (Source) Configuration - Assuming default localhost from host view, but inside docker this script might run differently.
# Ideally we run this script from the HOST machine where it can access both:
# 1. MySQL on localhost:3306 (or configured host)
# 2. Postgres on localhost:5432 (mapped from docker)

# Source Config
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_USER = os.getenv('MYSQL_USER', 'apple_user')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '') # Empty default as per db.py
MYSQL_DB = 'apple_academy'
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))

# Dest Config (Postgres)
PG_HOST = os.getenv('PG_HOST', 'localhost') 
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'password')
PG_DB = os.getenv('PG_NAME', 'apple_academy')
PG_PORT = int(os.getenv('PG_PORT', 5432))

TABLES = [
    'users',
    'tipos_devices',
    'alunos',
    'devices',        # Note: devices has no FK in CREATE TABLE SQL above to types, but check dependencies.
    'equipment_control',
    'livros',
    'exemplares',     # FK to livros
    'emprestimos',    # FK to alunos, devices/laptops? The CREATE SQL above links to 'devices'.
    'eventos'
    # Add other tables if any
]

def get_mysql_conn():
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DB,
            port=MYSQL_PORT
        )
        return conn
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return None

def get_pg_conn():
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            user=PG_USER,
            password=PG_PASSWORD,
            dbname=PG_DB,
            port=PG_PORT
        )
        return conn
    except Exception as e:
        print(f"Failed to connect to Postgres: {e}")
        return None

def migrate():
    print("🚀 Starting Migration...")
    
    mysql_conn = get_mysql_conn()
    pg_conn = get_pg_conn()
    
    if not mysql_conn or not pg_conn:
        print("❌ Connection failure. Check your DBs.")
        return

    mysql_cursor = mysql_conn.cursor(dictionary=True)
    pg_cursor = pg_conn.cursor()

    # Define boolean columns to convert
    BOOL_COLS = {
        'tipos_devices': ['para_emprestimo'],
        'alunos': ['tem_apple_id'],
        'devices': ['para_emprestimo'],
        'equipment_control': ['para_emprestimo'],
        'inventory': ['etiquetado'],
        'eventos': ['sincronizado']
    }

    for table in TABLES:
        print(f"Processing table: {table}...")
        
        # 1. Read from MySQL
        try:
            mysql_cursor.execute(f"SELECT * FROM {table}")
            rows = mysql_cursor.fetchall()
            
            if not rows:
                print(f"   Skipping {table} (no data)")
                continue
                
            print(f"   Found {len(rows)} rows.")
            
            # 2. Prepare columns and data
            columns = list(rows[0].keys())
            cols_str = ','.join(columns)
            
            data_tuples = []
            for row in rows:
                row_data = []
                for col in columns:
                    val = row[col]
                    # Convert int to bool for specific columns
                    if table in BOOL_COLS and col in BOOL_COLS[table]:
                        if val == 1: val = True
                        elif val == 0: val = False
                    row_data.append(val)
                data_tuples.append(tuple(row_data))

            # 3. Insert
            query = f"INSERT INTO {table} ({cols_str}) VALUES %s ON CONFLICT (id) DO NOTHING"
            
            execute_values(pg_cursor, query, data_tuples)
            
            # 4. Reset Sequence
            pg_cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1)) FROM {table}")
            
            pg_conn.commit()
            print(f"   ✅ Migrated {len(rows)} rows to {table}.")
            
        except Exception as e:
            print(f"   ❌ Error migrating {table}: {e}")
            pg_conn.rollback() # Rollback transaction for this table error
    
    print("🎉 Migration Completed.")
    mysql_cursor.close()
    mysql_conn.close()
    pg_cursor.close()
    pg_conn.close()

if __name__ == '__main__':
    migrate()
