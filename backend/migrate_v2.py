
import os
from database import get_db_connection
from dotenv import load_dotenv

load_dotenv()

def migrate():
    print("🚀 Iniciando migração das novas funcionalidades...")
    conn = get_db_connection()
    if not conn:
        print("❌ Erro ao conectar ao banco de dados.")
        return

    try:
        cursor = conn.cursor()
        db_type = os.getenv('DB_TYPE', 'mysql')

        # 1. Adicionar assinatura_path à tabela users
        print("Adicionando assinatura_path à tabela users...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN assinatura_path VARCHAR(255)")
        except Exception as e:
            print(f"Nota: Coluna assinatura_path pode já existir: {e}")

        # 2. Adicionar tags à tabela livros
        print("Adicionando tags à tabela livros...")
        try:
            cursor.execute("ALTER TABLE livros ADD COLUMN tags TEXT")
        except Exception as e:
            print(f"Nota: Coluna tags pode já existir: {e}")

        # 3. Adicionar capa_path à tabela livros se não existir (Embora já tenha foto_path, vamos garantir)
        # O usuário pediu "Imagem da capa do livro", livros já tem foto_path. Usaremos foto_path.

        # 4. Adicionar professor_id à tabela emprestimos_livros para vincular ao professor responsável
        print("Adicionando professor_id à tabela emprestimos_livros...")
        try:
            cursor.execute("ALTER TABLE emprestimos_livros ADD COLUMN professor_id INT")
            cursor.execute("ALTER TABLE emprestimos_livros ADD CONSTRAINT fk_professor FOREIGN KEY (professor_id) REFERENCES users(id)")
        except Exception as e:
            print(f"Nota: Coluna professor_id pode já existir ou erro ao criar constraint: {e}")

        conn.commit()
        print("✅ Migração concluída com sucesso!")

    except Exception as e:
        print(f"❌ Erro na migração: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
