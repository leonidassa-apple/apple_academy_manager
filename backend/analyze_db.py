import mysql.connector
from database import get_db_connection

def analyze_database():
    print("🔍 Iniciando análise do banco de dados...")
    
    conn = get_db_connection()
    if not conn:
        print("❌ Não foi possível conectar ao banco de dados.")
        return

    try:
        cursor = conn.cursor()
        
        # Obter lista de tabelas
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        if not tables:
            print("ℹ️  Nenhuma tabela encontrada no banco de dados.")
            return

        print(f"\n📊 Encontradas {len(tables)} tabelas. Contando registros...\n")
        print(f"{'Tabela':<30} | {'Registros':<10}")
        print("-" * 45)
        
        total_records = 0
        
        for table in tables:
            table_name = table[0]
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"{table_name:<30} | {count:<10}")
                total_records += count
            except mysql.connector.Error as e:
                print(f"{table_name:<30} | Erro: {e}")

        print("-" * 45)
        print(f"{'TOTAL':<30} | {total_records:<10}")
        
    except mysql.connector.Error as e:
        print(f"❌ Erro durante a análise: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            print("\n🔌 Conexão fechada.")

if __name__ == "__main__":
    analyze_database()
