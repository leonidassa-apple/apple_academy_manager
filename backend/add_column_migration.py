
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'db'), 
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_NAME')
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Erro de conexão: {err}")
        return None

def migrate():
    conn = get_db_connection()
    if not conn:
        return

    cursor = conn.cursor()
    try:
        print("Adicionando coluna criado_por na tabela emprestimos_livros...")
        cursor.execute("ALTER TABLE emprestimos_livros ADD COLUMN criado_por INT")
        cursor.execute("ALTER TABLE emprestimos_livros ADD CONSTRAINT fk_emprestimos_livros_criado_por FOREIGN KEY (criado_por) REFERENCES users(id)")
        conn.commit()
        print("Migração concluída com sucesso!")
    except mysql.connector.Error as err:
        if "Duplicate column name" in str(err):
            print("Coluna já existe.")
        else:
            print(f"Erro na migração: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()
