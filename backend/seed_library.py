from app import app, get_db_connection, get_db_cursor
import random
from datetime import date, timedelta

def seed_library():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("Failed to connect to DB")
            return

        try:
            cursor = get_db_cursor(conn)
            
            # 1. Insert Books
            books = [
                ('Clean Code', 'Robert C. Martin', '978-0132350884', 'Tecnologia', '2008', 'Prentice Hall', '1', 'A Handbook of Agile Software Craftsmanship'),
                ('The Pragmatic Programmer', 'Andrew Hunt', '978-0201616224', 'Tecnologia', '1999', 'Addison-Wesley', '1', 'From Journeyman to Master'),
                ('Design Patterns', 'Erich Gamma', '978-0201633610', 'Tecnologia', '1994', 'Addison-Wesley', '1', 'Elements of Reusable Object-Oriented Software'),
                ('Dom Casmurro', 'Machado de Assis', '978-8572325087', 'Literatura', '1899', 'Garnier', '1', 'Clássico da literatura brasileira')
            ]
            
            print("Seeding Books...")
            book_ids = []
            for b in books:
                cursor.execute(
                    "INSERT INTO livros (titulo, autor, isbn, categoria, ano, editora, edicao, descricao) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    b
                )
                if app.config.get('DB_TYPE') == 'postgres' or True: # Force fetch for returning id
                    result = cursor.fetchone()
                    book_ids.append(result['id'] if isinstance(result, dict) else result[0])

            # 2. Insert Exemplares (Copies)
            print("Seeding Exemplares...")
            exemplar_ids = []
            for bid in book_ids:
                # Add 2 copies for each book
                for i in range(1, 3):
                    code = f"LIB-{bid:03d}-{i}"
                    cursor.execute(
                        "INSERT INTO exemplares (livro_id, codigo_barras, status, localizacao) VALUES (%s, %s, 'Disponível', 'Estante A') RETURNING id",
                        (bid, code)
                    )
                    result = cursor.fetchone()
                    exemplar_ids.append(result['id'] if isinstance(result, dict) else result[0])

            # 3. Create a Loan (Emprestimo)
            # Need an aluno first
            cursor.execute("SELECT id FROM alunos LIMIT 1")
            aluno = cursor.fetchone()
            
            if aluno and exemplar_ids:
                aluno_id = aluno['id'] if isinstance(aluno, dict) else aluno[0]
                exemplar_id = exemplar_ids[0]
                
                print(f"Creating Loan for Aluno {aluno_id} with Exemplar {exemplar_id}...")
                
                # Update exemplar status
                cursor.execute("UPDATE exemplares SET status = 'Emprestado' WHERE id = %s", (exemplar_id,))
                
                # Insert loan (Backdated to simulate delay maybe?)
                today = date.today()
                cursor.execute('''
                    INSERT INTO emprestimos_livros (aluno_id, exemplar_id, data_retirada, data_previsao_devolucao, status)
                    VALUES (%s, %s, %s, %s, 'Ativo')
                ''', (aluno_id, exemplar_id, today, today + timedelta(days=14)))

            conn.commit()
            print("Library Seeded Successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"Error seeding: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    seed_library()
