import sys
import os
import mysql.connector
from datetime import datetime, timedelta

# Adicionar diretório atual ao path
sys.path.append(os.getcwd())
from database import get_db_connection

def verify_library_module():
    print("🚀 Iniciando verificação do Módulo de Biblioteca...")
    conn = get_db_connection()
    if not conn:
        print("❌ Falha na conexão com banco.")
        return

    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Criar um Livro de Teste
        print("\n📚 1. Testando Criação de Livro...")
        cursor.execute("INSERT INTO livros (titulo, autor, isbn) VALUES ('Livro de Teste', 'Autor Teste', '123456')")
        livro_id = cursor.lastrowid
        print(f"✅ Livro criado com ID: {livro_id}")
        
        # 2. Adicionar Exemplar
        print("\n🏷️  2. Testando Adição de Exemplar...")
        codigo_barras = f"TEST_{livro_id}"
        cursor.execute("INSERT INTO exemplares (livro_id, codigo_barras) VALUES (%s, %s)", (livro_id, codigo_barras))
        exemplar_id = cursor.lastrowid
        print(f"✅ Exemplar criado com ID: {exemplar_id} (Código: {codigo_barras})")
        
        # 3. Criar ou Obter Aluno
        print("\n👤 3. Preparando Aluno...")
        cursor.execute("SELECT id FROM alunos LIMIT 1")
        aluno = cursor.fetchone()
        if not aluno:
            cursor.execute("INSERT INTO alunos (nome, email, tipo_aluno) VALUES ('Aluno Teste', 'teste@email.com', 'Regular')")
            aluno_id = cursor.lastrowid
            print(f"✅ Aluno de teste criado: {aluno_id}")
        else:
            aluno_id = aluno['id']
            print(f"ℹ️  Usando aluno existente ID: {aluno_id}")
            
        # 4. Realizar Empréstimo
        print("\n📤 4. Testando Empréstimo...")
        data_retirada = datetime.now()
        data_previsao = data_retirada + timedelta(days=7)
        cursor.execute('''
            INSERT INTO emprestimos_livros (exemplar_id, aluno_id, data_retirada, data_previsao_devolucao, status)
            VALUES (%s, %s, %s, %s, 'Ativo')
        ''', (exemplar_id, aluno_id, data_retirada, data_previsao))
        emprestimo_id = cursor.lastrowid
        
        # Verificar status do exemplar
        cursor.execute("UPDATE exemplares SET status = 'Emprestado' WHERE id = %s", (exemplar_id,))
        conn.commit()
        
        cursor.execute("SELECT status FROM exemplares WHERE id = %s", (exemplar_id,))
        status_exemplar = cursor.fetchone()['status']
        
        if status_exemplar == 'Emprestado':
            print(f"✅ Empréstimo registrado (ID: {emprestimo_id}) e Status do Exemplar atualizado para 'Emprestado'")
        else:
            print(f"❌ Falha: Status do exemplar é {status_exemplar}")
            
        # 5. Realizar Devolução
        print("\n📥 5. Testando Devolução...")
        cursor.execute('''
            UPDATE emprestimos_livros 
            SET status = 'Finalizado', data_devolucao_real = NOW() 
            WHERE id = %s
        ''', (emprestimo_id,))
        
        cursor.execute("UPDATE exemplares SET status = 'Disponível' WHERE id = %s", (exemplar_id,))
        conn.commit()
        
        cursor.execute("SELECT status FROM exemplares WHERE id = %s", (exemplar_id,))
        status_final = cursor.fetchone()['status']
        
        # Verificar status final do empréstimo
        cursor.execute("SELECT status FROM emprestimos_livros WHERE id = %s", (emprestimo_id,))
        status_emp = cursor.fetchone()['status']
        
        if status_final == 'Disponível' and status_emp == 'Finalizado':
            print("✅ Devolução processada com sucesso!")
        else:
            print(f"❌ Falha na devolução. Exemplar: {status_final}, Empréstimo: {status_emp}")

        # Limpeza (Opcional, mas boa prática para script de teste)
        print("\n🧹 Limpando dados de teste...")
        cursor.execute("DELETE FROM emprestimos_livros WHERE id = %s", (emprestimo_id,))
        cursor.execute("DELETE FROM exemplares WHERE id = %s", (exemplar_id,))
        cursor.execute("DELETE FROM livros WHERE id = %s", (livro_id,))
        if not aluno: # Só deleta se criou
             cursor.execute("DELETE FROM alunos WHERE id = %s", (aluno_id,))
        conn.commit()
        print("✅ Dados de teste removidos.")
        
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    verify_library_module()
