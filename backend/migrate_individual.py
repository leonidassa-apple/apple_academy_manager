import sqlite3
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_specific_table(table_name):
    print(f"🚀 Migrando tabela específica: {table_name}")
    
    # Conectar ao SQLite
    sqlite_conn = sqlite3.connect('academy.db')
    sqlite_cursor = sqlite_conn.cursor()
    
    # Conectar ao MySQL
    mysql_conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    mysql_cursor = mysql_conn.cursor()
    
    try:
        # Obter estrutura
        sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
        columns = sqlite_cursor.fetchall()
        
        print(f"📋 Estrutura da tabela {table_name}:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        
        # Obter dados
        sqlite_cursor.execute(f"SELECT * FROM {table_name}")
        rows = sqlite_cursor.fetchall()
        
        print(f"📊 Total de registros: {len(rows)}")
        
        # Inserir no MySQL
        if rows:
            column_names = [col[1] for col in columns]
            placeholders = ', '.join(['%s'] * len(column_names))
            columns_str = ', '.join(column_names)
            
            for row in rows:
                try:
                    mysql_cursor.execute(
                        f"INSERT IGNORE INTO {table_name} ({columns_str}) VALUES ({placeholders})",
                        row
                    )
                except Error as e:
                    print(f"❌ Erro: {e}")
                    print(f"📝 Row: {row}")
            
            mysql_conn.commit()
            print(f"✅ Dados migrados para {table_name}")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        sqlite_conn.close()
        mysql_cursor.close()
        mysql_conn.close()

# Migrar tabelas específicas
tables = ['alunos', 'devices', 'equipment_control', 'emprestimos', 'users']
for table in tables:
    migrate_specific_table(table)
