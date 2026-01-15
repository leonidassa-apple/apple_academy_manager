import sqlite3
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def migrate_all_tables():
    print("🚀 Iniciando migração completa de todas as tabelas...")
    
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
    
    # Lista de todas as tabelas para migrar
    tables_to_migrate = ['alunos', 'devices', 'equipment_control', 'emprestimos', 'users']
    
    for table_name in tables_to_migrate:
        print(f"\n📦 Migrando tabela: {table_name}")
        
        try:
            # 1. Obter estrutura da tabela no SQLite
            sqlite_cursor.execute(f"PRAGMA table_info({table_name})")
            columns = sqlite_cursor.fetchall()
            
            if not columns:
                print(f"❌ Tabela {table_name} não encontrada no SQLite")
                continue
                
            print(f"✅ Estrutura encontrada: {len(columns)} colunas")
            
            # 2. Criar tabela no MySQL (se não existir)
            create_table_sql = generate_mysql_create_table(table_name, columns)
            
            try:
                mysql_cursor.execute(create_table_sql)
                print(f"✅ Tabela {table_name} criada no MySQL")
            except Error as e:
                if "already exists" in str(e).lower():
                    print(f"ℹ️  Tabela {table_name} já existe no MySQL")
                else:
                    print(f"⚠️  Erro ao criar tabela {table_name}: {e}")
            
            # 3. Migrar dados
            sqlite_cursor.execute(f"SELECT * FROM {table_name}")
            rows = sqlite_cursor.fetchall()
            
            if rows:
                # Obter nomes das colunas
                column_names = [col[1] for col in columns]
                placeholders = ', '.join(['%s'] * len(column_names))
                columns_str = ', '.join(column_names)
                
                # Inserir dados
                inserted_count = 0
                for row in rows:
                    try:
                        mysql_cursor.execute(
                            f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})",
                            row
                        )
                        inserted_count += 1
                    except Error as e:
                        if "duplicate" in str(e).lower():
                            # Ignorar duplicatas
                            pass
                        else:
                            print(f"❌ Erro ao inserir em {table_name}: {e}")
                
                mysql_conn.commit()
                print(f"✅ {inserted_count} registros migrados para {table_name}")
            else:
                print(f"ℹ️  Tabela {table_name} está vazia no SQLite")
                
        except Exception as e:
            print(f"❌ Erro ao migrar {table_name}: {e}")
            continue
    
    # Fechar conexões
    sqlite_conn.close()
    mysql_cursor.close()
    mysql_conn.close()
    
    print(f"\n🎉 Migração completa concluída!")
    print("📊 Tabelas migradas: alunos, devices, equipment_control, emprestimos, users")

def generate_mysql_create_table(table_name, columns):
    """Gera SQL CREATE TABLE para MySQL baseado na estrutura do SQLite"""
    
    create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
    
    column_definitions = []
    primary_keys = []
    
    for col in columns:
        col_name = col[1]
        col_type = col[2].upper()
        is_nullable = "NOT NULL" if col[3] else "NULL"
        is_primary = col[5]
        
        # Converter tipos SQLite para MySQL
        if 'INT' in col_type:
            mysql_type = "INT"
        elif 'BOOLEAN' in col_type or col_type == 'BOOL':
            mysql_type = "BOOLEAN"
        elif 'TEXT' in col_type:
            mysql_type = "TEXT"
        elif 'REAL' in col_type or 'FLOAT' in col_type or 'DOUBLE' in col_type:
            mysql_type = "DOUBLE"
        elif 'BLOB' in col_type:
            mysql_type = "BLOB"
        elif 'DATE' in col_type or 'TIME' in col_type:
            mysql_type = "DATETIME"
        else:
            mysql_type = "VARCHAR(255)"
        
        # Se for chave primária e auto increment
        if is_primary == 1:
            if 'INT' in mysql_type:
                mysql_type = "INT AUTO_INCREMENT"
            primary_keys.append(col_name)
        
        column_def = f"    {col_name} {mysql_type} {is_nullable}"
        column_definitions.append(column_def)
    
    # Adicionar chave primária
    if primary_keys:
        column_definitions.append(f"    PRIMARY KEY ({', '.join(primary_keys)})")
    
    create_sql += ",\n".join(column_definitions)
    create_sql += "\n);"
    
    return create_sql

def verify_migration():
    """Verifica se todas as tabelas foram migradas corretamente"""
    print("\n🔍 Verificando migração...")
    
    mysql_conn = mysql.connector.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    mysql_cursor = mysql_conn.cursor()
    
    # Verificar tabelas no MySQL
    mysql_cursor.execute("SHOW TABLES")
    mysql_tables = [table[0] for table in mysql_cursor.fetchall()]
    
    print("📋 Tabelas no MySQL:")
    for table in mysql_tables:
        mysql_cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = mysql_cursor.fetchone()[0]
        print(f"  {table}: {count} registros")
    
    mysql_cursor.close()
    mysql_conn.close()

if __name__ == "__main__":
    migrate_all_tables()
    verify_migration()
