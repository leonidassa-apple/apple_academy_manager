import sqlite3
import mysql.connector
from mysql.connector import Error
import os

def analyze_sqlite_database():
    """Analisa a estrutura completa do SQLite"""
    print("🔍 Analisando estrutura do SQLite...")
    
    conn = sqlite3.connect('academy.db')
    cursor = conn.cursor()
    
    # Listar todas as tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [table[0] for table in cursor.fetchall()]
    
    print(f"📋 Tabelas encontradas: {tables}")
    
    database_structure = {}
    
    for table in tables:
        print(f"\n--- Analisando tabela: {table} ---")
        
        # Estrutura das colunas
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        database_structure[table] = {
            'columns': columns,
            'data': []
        }
        
        print("Colunas:")
        for col in columns:
            print(f"  {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''} {'PK' if col[5] else ''}")
        
        # Contar registros
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Total de registros: {count}")
        
        # Coletar dados (apenas amostra para análise)
        if count > 0:
            cursor.execute(f"SELECT * FROM {table} LIMIT 5")
            sample_data = cursor.fetchall()
            database_structure[table]['data'] = sample_data
            print(f"Amostra de dados (5 primeiros):")
            for row in sample_data:
                print(f"  {row}")
    
    conn.close()
    return database_structure, tables

def generate_mysql_schema(database_structure, tables):
    """Gera schema MySQL baseado na estrutura do SQLite"""
    print("\n🔄 Gerando schema MySQL...")
    
    mysql_schema = []
    
    for table in tables:
        columns = database_structure[table]['columns']
        
        create_table_sql = f"CREATE TABLE {table} (\n"
        
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
        
        create_table_sql += ",\n".join(column_definitions)
        create_table_sql += "\n);"
        
        mysql_schema.append(create_table_sql)
        print(f"✅ Schema gerado para: {table}")
    
    return mysql_schema

def export_data_to_mysql(database_structure, tables):
    """Exporta dados do SQLite para MySQL"""
    print("\n📤 Exportando dados para MySQL...")
    
    try:
        # Conectar ao MySQL
        mysql_conn = mysql.connector.connect(
            host='localhost',
            database='apple_academy',
            user='apple_user',
            password='SenhaSegura123!'
        )
        mysql_cursor = mysql_conn.cursor()
        
        # Criar tabelas no MySQL
        mysql_schema = generate_mysql_schema(database_structure, tables)
        
        for schema in mysql_schema:
            try:
                mysql_cursor.execute(schema)
                print(f"✅ Tabela criada no MySQL")
            except Error as e:
                print(f"⚠️  Tabela já existe: {e}")
        
        # Inserir dados
        total_records = 0
        for table in tables:
            sqlite_conn = sqlite3.connect('academy.db')
            sqlite_cursor = sqlite_conn.cursor()
            
            # Obter todos os dados da tabela
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if rows:
                # Obter nomes das colunas
                sqlite_cursor.execute(f"PRAGMA table_info({table})")
                columns_info = sqlite_cursor.fetchall()
                column_names = [col[1] for col in columns_info]
                
                # Gerar placeholders
                placeholders = ', '.join(['%s'] * len(column_names))
                columns_str = ', '.join(column_names)
                
                # Inserir cada linha
                inserted = 0
                for row in rows:
                    try:
                        mysql_cursor.execute(
                            f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})",
                            row
                        )
                        inserted += 1
                    except Error as e:
                        print(f"❌ Erro ao inserir em {table}: {e}")
                        continue
                
                total_records += inserted
                print(f"✅ {inserted} registros inseridos em {table}")
            
            sqlite_conn.close()
        
        mysql_conn.commit()
        mysql_cursor.close()
        mysql_conn.close()
        
        print(f"\n🎉 Migração concluída!")
        print(f"📊 Total de registros migrados: {total_records}")
        
    except Error as e:
        print(f"❌ Erro na migração: {e}")

if __name__ == "__main__":
    # Analisar SQLite
    structure, tables = analyze_sqlite_database()
    
    # Exportar para MySQL
    export_data_to_mysql(structure, tables)
    
    print("\n" + "="*50)
    print("✅ ANÁLISE E MIGRAÇÃO CONCLUÍDAS!")
    print("="*50)
