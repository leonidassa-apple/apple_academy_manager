import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
try:
    import psycopg2
    from psycopg2 import Error as PgError
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None
    PgError = Exception
    RealDictCursor = None
try:
    import mysql.connector
    from mysql.connector import Error
    from mysql.connector.errors import IntegrityError
except ImportError:
    mysql = None
    Error = Exception
    IntegrityError = Exception

load_dotenv()

# Unified Exception classes
if os.getenv('DB_TYPE') == 'postgres':
    from psycopg2.errors import IntegrityError

def get_db_connection():
    """
    Estabelece conexão com o banco de dados (MySQL ou Postgres)
    """
    db_type = os.getenv('DB_TYPE', 'mysql')
    
    if db_type == 'postgres':
        try:
            # Note: client_encoding needed sometimes? Usually utf8 default.
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'postgres'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', 'password'),
                dbname=os.getenv('DB_NAME', 'apple_academy'),
                port=os.getenv('DB_PORT', '5432')
            )
            return conn
        except PgError as e:
            print(f"❌ Erro ao conectar com Postgres: {e}")
            return None
    else:
        try:
            conn = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'apple_user'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'apple_academy'),
                port=os.getenv('DB_PORT', '3306')
            )
            if conn.is_connected():
                print("✅ Conexão com MySQL estabelecida com sucesso!")
            return conn
        except Error as e:
            print(f"❌ Erro ao conectar com MySQL: {e}")
            return None

def get_db_cursor(conn):
    """
    Returns a dictionary-like cursor for the given connection.
    Handles difference between mysql-connector and psycopg2.
    """
    db_type = os.getenv('DB_TYPE', 'mysql')
    if db_type == 'postgres':
        return conn.cursor(cursor_factory=RealDictCursor)
    else:
        return conn.cursor(dictionary=True)


def init_app(app):
    """
    Função para inicializar o banco de dados com a aplicação Flask
    """
    print("🚀 Inicializando banco de dados...")
    create_tables()

def create_tables():
    """
    Cria todas as tabelas necessárias (MySQL ou Postgres)
    """
    db_type = os.getenv('DB_TYPE', 'mysql')
    
    try:
        conn = get_db_connection()
        if not conn: return False
        
        cursor = conn.cursor()
        
        # Helper for syntax difference
        AUTO_INC = "SERIAL PRIMARY KEY" if db_type == 'postgres' else "INT AUTO_INCREMENT PRIMARY KEY"
        TIMESTAMP_TYPE = "TIMESTAMP" if db_type == 'postgres' else "DATETIME"
        
        # Tabela de usuários
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS users
                         (id {AUTO_INC},
                          username VARCHAR(255) UNIQUE NOT NULL,
                          password VARCHAR(255) NOT NULL,
                          role VARCHAR(50) NOT NULL)""")
        
        # Tabela de alunos
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS alunos
                         (id {AUTO_INC},
                          nome VARCHAR(255) NOT NULL,
                          cpf VARCHAR(14) UNIQUE,
                          telefone VARCHAR(20),
                          email VARCHAR(255) UNIQUE NOT NULL,
                          endereco TEXT,
                          tem_apple_id BOOLEAN DEFAULT FALSE,
                          apple_id VARCHAR(255),
                          tipo_aluno VARCHAR(50) NOT NULL,
                          data_inicio DATE,
                          foto_path VARCHAR(255))""")
        
        # Tabela de devices
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS devices
                         (id {AUTO_INC},
                          tipo VARCHAR(100) NOT NULL,
                          modelo VARCHAR(100),
                          cor VARCHAR(50),
                          polegadas VARCHAR(10),
                          ano INT,
                          nome VARCHAR(255),
                          chip VARCHAR(100),
                          memoria VARCHAR(50),
                          numero_serie VARCHAR(255) UNIQUE,
                          versao_os VARCHAR(100),
                          status VARCHAR(50) DEFAULT 'Disponível',
                          para_emprestimo BOOLEAN DEFAULT TRUE,
                          observacao TEXT)""")
        
        # Tabela de empréstimos
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS emprestimos
                         (id {AUTO_INC},
                          aluno_id INT,
                          device_id INT,
                          acessorios TEXT,
                          data_retirada DATE,
                          data_devolucao DATE,
                          assinatura TEXT,
                          status VARCHAR(50) DEFAULT 'Ativo',
                          FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE,
                          FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE)""")
        
        # Tabela Equipment Control
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS equipment_control
                         (id {AUTO_INC},
                          tipo_device VARCHAR(100) NOT NULL,
                          numero_serie VARCHAR(255) UNIQUE NOT NULL,
                          modelo VARCHAR(100),
                          cor VARCHAR(50),
                          status VARCHAR(50) DEFAULT 'Disponível',
                          para_emprestimo BOOLEAN DEFAULT TRUE,
                          responsavel VARCHAR(255),
                          local VARCHAR(255),
                          convenio VARCHAR(255),
                          observacao TEXT,
                          processador VARCHAR(100),
                          memoria VARCHAR(50),
                          armazenamento VARCHAR(50),
                          tela VARCHAR(50),
                          data_cadastro DATE DEFAULT (CURRENT_DATE))""")
        
        # Tabela de inventário
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS inventory
                         (id {AUTO_INC},
                          tombamento VARCHAR(100) UNIQUE NOT NULL,
                          equipamento VARCHAR(255) NOT NULL,
                          carga VARCHAR(255),
                          local VARCHAR(255),
                          etiquetado BOOLEAN DEFAULT FALSE,
                          data_cadastro DATE DEFAULT (CURRENT_DATE))""")
        
        # Tabela Tipos de Devices
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS tipos_devices
                         (id {AUTO_INC},
                          nome VARCHAR(255) UNIQUE NOT NULL,
                          categoria VARCHAR(100),
                          descricao TEXT,
                          para_emprestimo BOOLEAN DEFAULT TRUE,
                          data_cadastro DATE DEFAULT (CURRENT_DATE))""")
        
        # Tabela de Livros
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS livros
                         (id {AUTO_INC},
                          titulo VARCHAR(255) NOT NULL,
                          autor VARCHAR(255) NOT NULL,
                          isbn VARCHAR(20),
                          categoria VARCHAR(100),
                          ano INT,
                          editora VARCHAR(100),
                          edicao VARCHAR(50),
                          descricao TEXT,
                          foto_path VARCHAR(255),
                          data_cadastro DATE DEFAULT (CURRENT_DATE))""")

        # Tabela de Exemplares
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS exemplares
                         (id {AUTO_INC},
                          livro_id INT NOT NULL,
                          codigo_barras VARCHAR(50) UNIQUE NOT NULL,
                          status VARCHAR(50) DEFAULT 'Disponível',
                          localizacao VARCHAR(100),
                          observacao TEXT,
                          data_aquisicao DATE DEFAULT (CURRENT_DATE),
                          FOREIGN KEY (livro_id) REFERENCES livros (id) ON DELETE CASCADE)""")

        # Tabela de Empréstimos de Livros
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS emprestimos_livros
                         (id {AUTO_INC},
                          exemplar_id INT NOT NULL,
                          aluno_id INT NOT NULL,
                          data_retirada {TIMESTAMP_TYPE} NOT NULL,
                          data_previsao_devolucao {TIMESTAMP_TYPE} NOT NULL,
                          data_devolucao_real {TIMESTAMP_TYPE},
                          status VARCHAR(50) DEFAULT 'Ativo',
                          renovacoes INT DEFAULT 0,
                          observacao TEXT,
                          criado_por INT,
                          assinatura LONGTEXT,
                          FOREIGN KEY (exemplar_id) REFERENCES exemplares (id),
                          FOREIGN KEY (aluno_id) REFERENCES alunos (id))""")

        # Tabela de Reservas
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS reservas_livros
                         (id {AUTO_INC},
                          livro_id INT NOT NULL,
                          aluno_id INT NOT NULL,
                          data_reserva {TIMESTAMP_TYPE} DEFAULT CURRENT_TIMESTAMP,
                          status VARCHAR(50) DEFAULT 'Ativa',
                          FOREIGN KEY (livro_id) REFERENCES livros (id),
                          FOREIGN KEY (aluno_id) REFERENCES alunos (id))""")

        # Tabela de Eventos
        cursor.execute(f"""CREATE TABLE IF NOT EXISTS eventos
                         (id {AUTO_INC},
                          titulo VARCHAR(255) NOT NULL,
                          descricao TEXT,
                          data_inicio {TIMESTAMP_TYPE} NOT NULL,
                          data_fim {TIMESTAMP_TYPE} NOT NULL,
                          local VARCHAR(255),
                          cor VARCHAR(20) DEFAULT '#007bff',
                          tipo VARCHAR(50),
                          participantes TEXT,
                          criado_por INT,
                          google_event_id VARCHAR(255),
                          sincronizado BOOLEAN DEFAULT FALSE,
                          data_criacao {TIMESTAMP_TYPE} DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (criado_por) REFERENCES users (id) ON DELETE SET NULL)""")

        # Criar usuário admin padrão
        try:
            admin_password = generate_password_hash(os.getenv('ADMIN_PASSWORD', 'admin123'))
            sql = "INSERT INTO users (username, password, role) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING" if db_type == 'postgres' else "INSERT IGNORE INTO users (username, password, role) VALUES (%s, %s, %s)"
            cursor.execute(sql, ('admin', admin_password, 'admin'))
        except Exception as e:
            print(f"Usuário admin já existe ou erro: {e}")
        
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        if conn: conn.close()

def execute_query(query, params=None):
    """
    Executa uma query e retorna o resultado
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(dictionary=True) if os.getenv('DB_TYPE') != 'postgres' else conn.cursor()
        # Note: Psycopg2 cursor doesn't support dictionary=True by default in this way, 
        # but for now we keep it simple or user might see tuples. 
        # Phase 2 refactor will address RealDictCursor.
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith('SELECT'):
            result = cursor.fetchall()
            # If postgres, we might need to convert tuples to dicts if the app expects dicts.
            # But the app uses MySQL connector usually which returns dicts if configured.
            # For now, let's assume Phase 2 will fix the dict mapping.
        else:
            conn.commit()
            result = cursor.rowcount
        
        cursor.close()
        return result
        
    except Exception as e:
        print(f"❌ Erro ao executar query: {e}")
        return None
    finally:
        if conn: conn.close()

def testar_conexao():
    """
    Função para testar manualmente a conexão
    """
    print("🧪 Testando conexão...")
    conn = get_db_connection()
    if conn:
        print("✅ Conexão estabelecida!")
        conn.close()
        return True
    else:
        print("❌ Falha na conexão")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando teste...")
    testar_conexao()
    create_tables()