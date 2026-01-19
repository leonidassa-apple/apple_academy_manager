
from database import get_db_connection, init_app, execute_query, get_db_cursor, IntegrityError
from dotenv import load_dotenv
# import mysql.connector # Removed direct dependency
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file, send_from_directory
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import shutil
import pandas as pd
from werkzeug.utils import secure_filename
import io
import json
import re

import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_key')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24) # Sessão dura 24h
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # 1 hora
# Ajuste de Cookies para Segurança
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production' # True apenas em produção
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Configuração de Logging para Segurança
if not app.debug:
    if not os.path.exists('logs'):
        os.mkdir('logs')
    file_handler = RotatingFileHandler('logs/security.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Apple Academy Manager Startup')

# Configuração de Email
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', app.config['MAIL_USERNAME'])

mail = Mail(app)

# Inicializar sistema de banco de dados
load_dotenv()
init_app(app)  # Esta linha agora deve funcionar

# Configuração de Segurança
csrf = CSRFProtect(app)
# Limiter para proteção contra abusos
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["500 per day", "100 per hour"],
    storage_uri="memory://"
)

from werkzeug.exceptions import HTTPException

# Desabilitar cache e injetar headers de segurança
@app.after_request
def add_security_headers(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    # Security Headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

from flask_wtf.csrf import CSRFProtect, generate_csrf

# Manipulador global de erros para evitar vazamento de informações (Internal Server Error)
@app.after_request
def set_csrf_cookie(response):
    # Envia o token CSRF em um cookie para que o Frontend (React) possa ler e enviar de volta nos headers
    csrf_token = generate_csrf()
    response.set_cookie('csrf_token', csrf_token, samesite='Lax', secure=app.config['SESSION_COOKIE_SECURE'])
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    # Mantém o comportamento original para erros HTTP (404, 403, etc)
    if isinstance(e, HTTPException):
        return e
    
    # Log do erro real no servidor para depuração
    app.logger.error(f"Erro Crítico: {str(e)}", exc_info=True)
    
    # Retorna mensagem genérica para o usuário final
    return jsonify({
        'success': False, 
        'message': 'Ocorreu um erro interno de processamento. Nossa equipe técnica foi notificada.'
    }), 500

# Configuração do Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Configuração de Upload
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'csv', 'xlsx'}
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_file_image(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def parse_boolean(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    return str(value).strip().lower() in ['true', '1', 'sim', 's', 'yes', 'y']

def upsert_device_from_equipment(conn, equipment_data):
    """
    Garante que cada registro do equipment_control esteja sincronizado com a tabela devices.
    Sincroniza quando status='Emprestado' e para_emprestimo=true.
    """
    if not equipment_data:
        return
    
    numero_serie = equipment_data.get('numero_serie')
    if not numero_serie:
        return
    
    tipo = equipment_data.get('tipo_device') or 'Outro'
    status = equipment_data.get('status') or 'Disponível'
    para_emprestimo = parse_boolean(equipment_data.get('para_emprestimo'), True)
    
    # Se não está para empréstimo, remove da tabela devices se existir
    if not para_emprestimo:
        cursor = get_db_cursor(conn)
        try:
            cursor.execute("DELETE FROM devices WHERE numero_serie = %s", (numero_serie,))
            conn.commit()
        finally:
            cursor.close()
        return
    
    # Só sincroniza se para_emprestimo=true
    # Sincroniza tanto 'Disponível' quanto 'Emprestado'
    if status not in ['Disponível', 'Emprestado', 'Reservado']:
        # Se estiver em manutenção ou outro status, remove do devices para não aparecer na lista de empréstimo
        cursor = get_db_cursor(conn)
        try:
            cursor.execute("DELETE FROM devices WHERE numero_serie = %s", (numero_serie,))
            conn.commit()
        finally:
            cursor.close()
        return
    
    nome = equipment_data.get('local') or equipment_data.get('responsavel') or f"{tipo} - {numero_serie}"
    observacao = equipment_data.get('observacao') or ''
    
    extras = []
    for label, key in [('Responsável', 'responsavel'), ('Local', 'local'), ('Convênio', 'convenio')]:
        if equipment_data.get(key):
            extras.append(f"{label}: {equipment_data.get(key)}")
    if extras:
        observacao = f"{observacao} | {' | '.join(extras)}".strip(' |')
    
    cursor = get_db_cursor(conn)
    try:
        cursor.execute("SELECT id FROM devices WHERE numero_serie = %s", (numero_serie,))
        existing = cursor.fetchone()
        
        # Ensure para_emprestimo is boolean for Postgres
        para_emprestimo_bool = parse_boolean(para_emprestimo, True)

        if existing:
            cursor.execute('''UPDATE devices SET 
                              tipo = %s,
                              modelo = %s,
                              cor = %s,
                              nome = %s,
                              status = %s,
                              para_emprestimo = %s,
                              observacao = %s
                              WHERE numero_serie = %s''',
                           (tipo,
                            equipment_data.get('modelo', ''),
                            equipment_data.get('cor', ''),
                            nome,
                            status,
                            para_emprestimo_bool,
                            observacao,
                            numero_serie))
        else:
            cursor.execute('''INSERT INTO devices
                              (tipo, modelo, cor, nome, numero_serie, status, para_emprestimo, observacao)
                              VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''',
                           (tipo,
                            equipment_data.get('modelo', ''),
                            equipment_data.get('cor', ''),
                            nome,
                            numero_serie,
                            status,
                            para_emprestimo_bool,
                            observacao))
        conn.commit()
    except Exception as e:
        print(f"Erro ao sincronizar device {numero_serie}: {e}")
        conn.rollback()
    finally:
        cursor.close()

def criar_pasta_uploads():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

class User(UserMixin):
    def __init__(self, id, username, role, email=None, foto_path=None):
        self.id = id
        self.username = username
        self.role = role
        self.email = email
        self.foto_path = foto_path

@login_manager.user_loader
def load_user(user_id):
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        
        if user:
            return User(user['id'], user['username'], user['role'], user.get('email'), user.get('foto_path'))
        return None
    except Exception as e:
        print(f"Erro ao carregar usuário: {e}")
        return None
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS PRINCIPAIS
# =============================================================================

@app.route('/')
@login_required
def index():
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        if not conn:
            flash('Erro de conexão com o banco de dados!', 'error')
            return render_template('login.html')
        
        try:
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()
            cursor.close()
            
            if user and check_password_hash(user['password'], password):
                user_obj = User(user['id'], user['username'], user['role'])
                login_user(user_obj)
                flash('Login realizado com sucesso!', 'success')
                return redirect(url_for('dashboard'))
            else:
                flash('Credenciais inválidas!', 'error')
        except Exception as e:
            flash(f'Erro ao fazer login: {str(e)}', 'error')
        finally:
            if conn:
                conn.close()
    
    return render_template('login.html')

# =============================================================================
# API AUTH ROUTES (Fase 2)
# =============================================================================

@app.route('/api/me')
def api_me():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': {
                'username': current_user.username,
                'role': current_user.role,
                'id': current_user.id,
                'foto_path': current_user.foto_path if hasattr(current_user, 'foto_path') else None
            }
        })
    return jsonify({'authenticated': False})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Missing JSON data'}), 400
        
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500
    
    try:
        cursor = conn.cursor() # Use default cursor first if dict cursor fails on postgres
        # But we need dict access. Wrapper in database.py handles it? 
        # database.py execute_query returns dict or tuple? 
        # Let's use the raw connection for now carefully.
        # Actually in database.py we saw I kept dictionary=True for MySQL but simple cursor for Postgres.
        # I should unify this behavior later.
        # For now, let's fetch based on position or try dict cursor if available.
        
        # Adaptation for proper dict fetching
        if os.getenv('DB_TYPE') == 'postgres':
             cursor = conn.cursor() # Postgres cursor
             # Postgres users table: id, username, password, role
             cursor.execute("SELECT id, username, password, role FROM users WHERE username = %s", (username,))
             # Need to map columns manually if not using RealDictCursor
             row = cursor.fetchone()
             if row:
                 user = {'id': row[0], 'username': row[1], 'password': row[2], 'role': row[3], 'email': None}
             else:
                 user = None
        else:
             cursor = get_db_cursor(conn)
             cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
             user = cursor.fetchone()
             # Handle mysql dict cursor potentially missing email key if table doesn't have it
             if user and 'email' not in user:
                 user['email'] = None
             
        cursor.close()
        
        if user:
            if check_password_hash(user['password'], password):
                user_obj = User(user['id'], user['username'], user['role'], user.get('email'))
                login_user(user_obj)
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'role': user['role']
                    }
                })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'success': False, 'message': 'Internal Server Error'}), 500
    finally:
        if conn and conn.is_connected() if hasattr(conn, 'is_connected') else False:
             conn.close()
        elif conn:
            conn.close()

@app.route('/api/logout', methods=['POST'])
def api_logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out successfully'})



@app.route('/api/dashboard', methods=['GET'])
@login_required
def api_dashboard():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database connection error'}), 500
    
    try:
        cursor = get_db_cursor(conn) if os.getenv('DB_TYPE') != 'postgres' else conn.cursor()
        
        # Helper to fetch dictionary or use tuple mapping for Postgres
        def fetch_one(query, params=None):
            if params: cursor.execute(query, params)
            else: cursor.execute(query)
            
            if os.getenv('DB_TYPE') == 'postgres':
                # For single count queries usually returned as (count,)
                 row = cursor.fetchone()
                 return {'total': row[0]} if row else {'total': 0}
            else:
                 return cursor.fetchone()

        # Estatísticas de alunos
        total_alunos = fetch_one("SELECT COUNT(*) as total FROM alunos")['total']
        alunos_regular = fetch_one("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Regular'")['total']
        alunos_foundation = fetch_one("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation'")['total']
        
        tres_meses_atras = datetime.now() - timedelta(days=90)
        foundation_trimestre = fetch_one("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND data_inicio >= %s", (tres_meses_atras.date(),))['total']
        
        # Postgres extract year syntax vs MySQL EXTRACT(YEAR FROM )
        if os.getenv('DB_TYPE') == 'postgres':
             foundation_ano = fetch_one("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND EXTRACT(YEAR FROM data_inicio) = %s", (datetime.now().year,))['total']
        else:
             foundation_ano = fetch_one("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND EXTRACT(YEAR FROM data_inicio) = %s", (datetime.now().year,))['total']
        
        # Devices stats - Simplified for API first version, copying logic
        # Note: Current logic has complex subqueries. 
        # For Postgres compatibility, we should ensure SQL is compatible or split queries.
        # MySQL subqueries in select list works in Postgres too usually.
        
        devices_query_emprestimo = '''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE para_emprestimo = TRUE) +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = TRUE AND d.id IS NULL)
            as total
        '''
        # MySQL uses 1/0 for boolean sometimes, but we used TRUE/FALSE in DDL if Postgres.
        # In MySQL boolean is tinyint(1). TRUE is 1.
        # So using TRUE should work for both (MySQL parses TRUE as 1).
        
        devices_emprestimo = fetch_one(devices_query_emprestimo)['total']
        
        devices_query_emprestados = '''
           SELECT 
                (SELECT COUNT(*) FROM devices WHERE status = 'Emprestado') +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = TRUE AND d.id IS NULL)
            as total
        '''
        devices_emprestados = fetch_one(devices_query_emprestados)['total']
        
        # Devices Disponíveis
        devices_disponiveis = fetch_one("SELECT COUNT(*) as total FROM devices WHERE status = 'Disponível' AND para_emprestimo = TRUE")['total']
        
        # Devices Regular/Foundation
        # MySQL IN works same.
        devices_regular = fetch_one("SELECT COUNT(*) as total FROM devices WHERE tipo IN ('Macbook', 'Mac Mini') AND para_emprestimo = TRUE")['total']
        devices_foundation = fetch_one("SELECT COUNT(*) as total FROM devices WHERE tipo IN ('iPad', 'iPhone') AND para_emprestimo = TRUE")['total']
        
        # Emprestimos Recentes
        # Postgres: LIMIT 5 works.
        cursor.execute('''SELECT e.data_retirada, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo 
                         FROM emprestimos e
                         JOIN alunos a ON e.aluno_id = a.id
                         JOIN devices d ON e.device_id = d.id
                         WHERE e.status = 'Ativo'
                         ORDER BY e.data_retirada DESC, e.id DESC LIMIT 5''')
        
        if os.getenv('DB_TYPE') == 'postgres':
             rows = cursor.fetchall()
             emprestimos_recentes = []
             for r in rows:
                 emprestimos_recentes.append({
                     'data_retirada': r[0].strftime('%d/%m/%Y') if r[0] else None,
                     'aluno_nome': r[1],
                     'device_nome': r[2],
                     'device_tipo': r[3]
                 })
        else:
             emprestimos_recentes = cursor.fetchall() # Dict cursor
             for emp in emprestimos_recentes:
                   if emp['data_retirada']:
                        # format logic same as before...
                        pass

        # For brevity, returning simplified stats structure
        stats = {
            'alunos': {
                'total': total_alunos,
                'regular': alunos_regular,
                'foundation': alunos_foundation,
                'foundation_trimestre': foundation_trimestre,
                'foundation_ano': foundation_ano
            },
            'devices': {
                'total_emprestimo': devices_emprestimo,
                'emprestados': devices_emprestados,
                'disponiveis': devices_disponiveis,
                'regular': devices_regular,
                'foundation': devices_foundation
            },
            'recentes': emprestimos_recentes
        }
        
        cursor.close()
        return jsonify({'success': True, 'data': stats})
        
    except Exception as e:
        print(F"Dashboard API Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    return redirect(url_for('login'))




@app.route('/dashboard')
@login_required
def dashboard():
    # Lógica para estatísticas do dashboard
    conn = get_db_connection()
    if not conn:
        flash('Erro de conexão com o banco de dados!', 'error')
        return render_template('dashboard.html')
    
    try:
        cursor = get_db_cursor(conn)
        
        # Estatísticas de alunos - ATUALIZADAS
        cursor.execute("SELECT COUNT(*) as total FROM alunos")
        total_alunos = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Regular'")
        alunos_regular = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation'")
        alunos_foundation = cursor.fetchone()['total']
        
        # Foundation por trimestre atual (últimos 3 meses)
        tres_meses_atras = datetime.now() - timedelta(days=90)
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND data_inicio >= %s", (tres_meses_atras.date(),))
        foundation_trimestre = cursor.fetchone()['total']
        
        # Foundation por ano atual
        ano_atual = datetime.now().year
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND EXTRACT(YEAR FROM data_inicio) = %s", (ano_atual,))
        foundation_ano = cursor.fetchone()['total']
        
        # Estatísticas de devices - CORRIGIDAS PARA INCLUIR EQUIPMENT_CONTROL
        # Para Empréstimo: devices com para_emprestimo=1 + equipments com status='Emprestado' e para_emprestimo=1 (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE para_emprestimo = 1) +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = 1 AND d.id IS NULL)
            as total
        ''')
        devices_emprestimo = cursor.fetchone()['total']
        
        # Emprestados: devices com status='Emprestado' + equipments com status='Emprestado' e para_emprestimo=1 (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE status = 'Emprestado') +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = 1 AND d.id IS NULL)
            as total
        ''')
        devices_emprestados = cursor.fetchone()['total']
        
        # Disponíveis: apenas devices com status='Disponível' e para_emprestimo=1
        cursor.execute("SELECT COUNT(*) as total FROM devices WHERE status = 'Disponível' AND para_emprestimo = 1")
        devices_disponiveis = cursor.fetchone()['total']
        
        # Devices para alunos Regular (apenas da tabela devices)
        cursor.execute("SELECT COUNT(*) as total FROM devices WHERE tipo IN ('Macbook', 'Mac Mini') AND para_emprestimo = 1")
        devices_regular = cursor.fetchone()['total']
        
        # Devices para alunos Foundation (apenas da tabela devices)
        cursor.execute("SELECT COUNT(*) as total FROM devices WHERE tipo IN ('iPad', 'iPhone') AND para_emprestimo = 1")
        devices_foundation = cursor.fetchone()['total']
        
        # Empréstimos Recentes (últimos 5 empréstimos ativos) - ATUALIZADO
        cursor.execute('''SELECT e.data_retirada, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo 
                         FROM emprestimos e
                         JOIN alunos a ON e.aluno_id = a.id
                         JOIN devices d ON e.device_id = d.id
                         WHERE e.status = 'Ativo'
                         ORDER BY e.data_retirada DESC, e.id DESC LIMIT 5''')
        emprestimos_recentes = cursor.fetchall()
        
        # Formatar datas dos empréstimos recentes
        for emp in emprestimos_recentes:
            if emp['data_retirada']:
                if isinstance(emp['data_retirada'], datetime):
                    emp['data_retirada'] = emp['data_retirada'].strftime('%d/%m/%Y')
                elif hasattr(emp['data_retirada'], 'strftime'):
                    emp['data_retirada'] = emp['data_retirada'].strftime('%d/%m/%Y')
                else:
                    try:
                        date_obj = datetime.strptime(str(emp['data_retirada']), '%Y-%m-%d')
                        emp['data_retirada'] = date_obj.strftime('%d/%m/%Y')
                    except:
                        emp['data_retirada'] = str(emp['data_retirada'])
        
        # Devices Mais Utilizados (top 5 devices com mais empréstimos) - ATUALIZADO
        cursor.execute('''SELECT d.nome, d.tipo, COUNT(e.id) as total_emprestimos
                         FROM devices d
                         LEFT JOIN emprestimos e ON d.id = e.device_id
                         GROUP BY d.id
                         ORDER BY total_emprestimos DESC
                         LIMIT 5''')
        devices_mais_utilizados = cursor.fetchall()

        # --- ESTATÍSTICAS BIBLIOTECA ---
        try:
            # Total de Títulos
            cursor.execute("SELECT COUNT(*) as total FROM livros")
            total_livros = cursor.fetchone()['total']

            # Exemplares Disponíveis (Total de exemplares com status 'Disponível')
            cursor.execute("SELECT COUNT(*) as total FROM exemplares WHERE status = 'Disponível'")
            livros_disponiveis = cursor.fetchone()['total']

            # Empréstimos de Livros Ativos
            cursor.execute("SELECT COUNT(*) as total FROM emprestimos_livros WHERE status = 'Ativo'")
            emprestimos_livros_ativos = cursor.fetchone()['total']
        except Exception as e:
            print(f"Erro ao carregar stats biblioteca: {e}")
            total_livros = 0
            livros_disponiveis = 0
            emprestimos_livros_ativos = 0

        # Devices em Manutenção: devices + equipments com status='Manutenção' (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE status = 'Manutenção') +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Manutenção' AND d.id IS NULL)
            as total
        ''')
        devices_manutencao = cursor.fetchone()['total']
        
        cursor.close()
        
        return render_template('dashboard.html', 
                             total_alunos=total_alunos,
                             alunos_regular=alunos_regular,
                             alunos_foundation=alunos_foundation,
                             foundation_trimestre=foundation_trimestre,
                             foundation_ano=foundation_ano,
                             devices_emprestimo=devices_emprestimo,
                             devices_emprestados=devices_emprestados,
                             devices_disponiveis=devices_disponiveis,
                             devices_regular=devices_regular,
                             devices_foundation=devices_foundation,
                             devices_manutencao=devices_manutencao,
                             emprestimos_recentes=emprestimos_recentes,
                             devices_mais_utilizados=devices_mais_utilizados,

                             # Dados Biblioteca
                             total_livros=total_livros,
                             livros_disponiveis=livros_disponiveis,
                             emprestimos_livros_ativos=emprestimos_livros_ativos)
    
    except Exception as e:
        flash(f'Erro ao carregar dashboard: {str(e)}', 'error')
        return render_template('dashboard.html')
    finally:
        if conn:
            conn.close()

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logout realizado com sucesso!', 'success')
    return redirect(url_for('login'))

# =============================================================================
# NOVA ROTA: ALTERAR SENHA
# =============================================================================

@app.route('/alterar-senha', methods=['POST'])
@login_required
def alterar_senha():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        senha_atual = data.get('senha_atual')
        nova_senha = data.get('nova_senha')
        
        if not senha_atual or not nova_senha:
            return jsonify({'success': False, 'message': 'Todos os campos são obrigatórios!'})
        
        if len(nova_senha) < 6:
            return jsonify({'success': False, 'message': 'A senha deve ter no mínimo 6 caracteres!'})
        
        cursor = get_db_cursor(conn)
        
        # Verificar senha atual
        cursor.execute("SELECT password FROM users WHERE id = %s", (current_user.id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password'], senha_atual):
            cursor.close()
            return jsonify({'success': False, 'message': 'Senha atual incorreta!'})
        
        # Atualizar senha
        cursor.execute("UPDATE users SET password = %s WHERE id = %s",
                     (generate_password_hash(nova_senha), current_user.id))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Senha alterada com sucesso!'})
    
    except Exception as e:
        app.logger.error(f"Erro ao alterar senha: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro ao alterar senha. Verifique se a senha atual está correta.'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE EQUIPMENT CONTROL (ATUALIZADAS COM PADRÃO SUGERIDO)
# =============================================================================

@app.route('/equipment-control')
@login_required
def equipment_control():
    # Verificar se é admin
    if current_user.role != 'admin':
        flash('Acesso não autorizado! Apenas administradores podem acessar esta página.', 'error')
        return redirect(url_for('dashboard'))
    
    return render_template('equipment_control.html')

# ROTA API PARA EQUIPMENT CONTROL - GET (LISTAR) - ATUALIZADA
@app.route('/api/equipment-control', methods=['GET'])
@login_required
def listar_equipment():
    # Verificar se é admin
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('SELECT * FROM equipment_control ORDER BY data_cadastro DESC')
        equipments = cursor.fetchall()
        cursor.close()
        
        # Converter tipos para JSON
        for equipment in equipments:
            equipment['para_emprestimo'] = bool(equipment['para_emprestimo'])
            # Converter data para string se necessário
            if equipment['data_cadastro']:
                equipment['data_cadastro'] = equipment['data_cadastro'].strftime('%Y-%m-%d')
        
        return jsonify({
            'success': True,
            'data': equipments
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar equipments: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ROTA API PARA EQUIPMENT CONTROL - POST (CRIAR) - ATUALIZADA
@app.route('/api/equipment-control', methods=['POST'])
@csrf.exempt
@login_required
def criar_equipment():
    # Verificar se é admin
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados JSON inválidos'}), 400
        
        # Validar campos obrigatórios
        if not data.get('tipo_device') or not data.get('numero_serie'):
            return jsonify({'success': False, 'message': 'Tipo de device e número de série são obrigatórios!'}), 400
        
        cursor = get_db_cursor(conn)
        normalized_data = {
            'tipo_device': data.get('tipo_device'),
            'numero_serie': data.get('numero_serie'),
            'modelo': data.get('modelo', ''),
            'cor': data.get('cor', ''),
            'status': data.get('status', 'Disponível'),
            'para_emprestimo': parse_boolean(data.get('para_emprestimo'), True),
            'responsavel': data.get('responsavel', ''),
            'local': data.get('local', ''),
            'convenio': data.get('convenio', ''),
            'observacao': data.get('observacao', ''),
            'processador': data.get('processador', ''),
            'memoria': data.get('memoria', ''),
            'armazenamento': data.get('armazenamento', ''),
            'tela': data.get('tela', '')
        }
        
        # Prepare query based on DB type
        query = '''
            INSERT INTO equipment_control 
            (tipo_device, numero_serie, modelo, cor, status, para_emprestimo, 
             responsavel, local, convenio, observacao, processador, memoria, armazenamento, tela, data_cadastro)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        
        if os.getenv('DB_TYPE') == 'postgres':
             query += ' RETURNING id'
        
        cursor.execute(query, (
            normalized_data['tipo_device'],
            normalized_data['numero_serie'],
            normalized_data['modelo'],
            normalized_data['cor'],
            normalized_data['status'],
            normalized_data['para_emprestimo'],
            normalized_data['responsavel'],
            normalized_data['local'],
            normalized_data['convenio'],
            normalized_data['observacao'],
            normalized_data['processador'],
            normalized_data['memoria'],
            normalized_data['armazenamento'],
            normalized_data['tela'],
            data.get('data_cadastro', datetime.now().date())
        ))
        
        if os.getenv('DB_TYPE') == 'postgres':
             equipment_id = cursor.fetchone()['id']
             conn.commit()
        else:
             conn.commit()
             equipment_id = cursor.lastrowid
        
        # CORREÇÃO: Chamar a função de upsert após o commit
        upsert_device_from_equipment(conn, normalized_data)
        
        cursor.close()
        
        return jsonify({
            'success': True, 
            'message': 'Equipment cadastrado com sucesso!',
            'id': equipment_id
        })
        
    except IntegrityError as e:
        conn.rollback()
        if 'numero_serie' in str(e):
            return jsonify({'success': False, 'message': 'Número de série já existe'}), 400
        app.logger.error(f"Erro de integridade ao cadastrar equipment: {str(e)}")
        return jsonify({'success': False, 'message': 'Erro de integridade nos dados.'}), 400
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Erro ao cadastrar equipment: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'message': 'Erro interno ao cadastrar equipamento.'}), 500
    finally:
        if conn:
            conn.close()

# ROTA API PARA EQUIPMENT CONTROL - PUT (ATUALIZAR) - ATUALIZADA
@app.route('/api/equipment-control/<int:equipment_id>', methods=['PUT'])
@login_required
def atualizar_equipment(equipment_id):
    # Verificar se é admin
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados JSON inválidos'}), 400
        
        cursor = get_db_cursor(conn)
        normalized_data = {
            'tipo_device': data.get('tipo_device'),
            'numero_serie': data.get('numero_serie'),
            'modelo': data.get('modelo', ''),
            'cor': data.get('cor', ''),
            'status': data.get('status', 'Disponível'),
            'para_emprestimo': parse_boolean(data.get('para_emprestimo'), True),
            'responsavel': data.get('responsavel', ''),
            'local': data.get('local', ''),
            'convenio': data.get('convenio', ''),
            'observacao': data.get('observacao', ''),
            'processador': data.get('processador', ''),
            'memoria': data.get('memoria', ''),
            'armazenamento': data.get('armazenamento', ''),
            'tela': data.get('tela', '')
        }
        
        cursor.execute('''
            UPDATE equipment_control SET 
            tipo_device = %s, numero_serie = %s, modelo = %s, cor = %s, 
            status = %s, para_emprestimo = %s, responsavel = %s, 
            local = %s, convenio = %s, observacao = %s, processador = %s,
            memoria = %s, armazenamento = %s, tela = %s
            WHERE id = %s
        ''', (
            normalized_data['tipo_device'],
            normalized_data['numero_serie'],
            normalized_data['modelo'],
            normalized_data['cor'],
            normalized_data['status'],
            normalized_data['para_emprestimo'],
            normalized_data['responsavel'],
            normalized_data['local'],
            normalized_data['convenio'],
            normalized_data['observacao'],
            normalized_data['processador'],
            normalized_data['memoria'],
            normalized_data['armazenamento'],
            normalized_data['tela'],
            equipment_id
        ))
        
        conn.commit()
        
        # CORREÇÃO: Chamar a função de upsert após o commit
        upsert_device_from_equipment(conn, normalized_data)
        
        cursor.close()
        
        return jsonify({
            'success': True, 
            'message': 'Equipment atualizado com sucesso!'
        })
        
    except IntegrityError as e:
        conn.rollback()
        if 'numero_serie' in str(e):
            return jsonify({'success': False, 'message': 'Número de série já existe'}), 400
        return jsonify({'success': False, 'message': f'Erro de integridade: {str(e)}'}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar equipment: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ROTA API PARA EQUIPMENT CONTROL - DELETE (EXCLUIR) - ATUALIZADA
@app.route('/api/equipment-control/<int:equipment_id>', methods=['DELETE'])
@login_required
def excluir_equipment(equipment_id):
    # Verificar se é admin
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        
        # Antes de deletar, precisamos do numero_serie para remover da tabela devices
        cursor.execute('SELECT numero_serie FROM equipment_control WHERE id = %s', (equipment_id,))
        result = cursor.fetchone()
        numero_serie = result['numero_serie'] if result else None
        
        cursor.execute('DELETE FROM equipment_control WHERE id = %s', (equipment_id,))
        
        conn.commit()
        
        # Se existir na tabela devices, remover
        if numero_serie:
            cursor.execute("DELETE FROM devices WHERE numero_serie = %s", (numero_serie,))
            conn.commit()
        
        cursor.close()
        
        return jsonify({
            'success': True, 
            'message': 'Equipment excluído com sucesso!'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir equipment: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# ROTA API PARA BUSCAR EQUIPMENT POR ID - ATUALIZADA
@app.route('/api/equipment-control/<int:equipment_id>', methods=['GET'])
@login_required
def buscar_equipment(equipment_id):
    # Verificar se é admin
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('SELECT * FROM equipment_control WHERE id = %s', (equipment_id,))
        equipment = cursor.fetchone()
        cursor.close()
        
        if not equipment:
            return jsonify({'success': False, 'message': 'Equipment não encontrado'}), 404
        
        # Converter tipos para JSON
        equipment['para_emprestimo'] = bool(equipment['para_emprestimo'])
        if equipment['data_cadastro']:
            equipment['data_cadastro'] = equipment['data_cadastro'].strftime('%Y-%m-%d')
        
        return jsonify({
            'success': True,
            'data': equipment
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar equipment: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# =============================================================================
# NOVA ROTA: TEMPLATE PARA EQUIPMENT CONTROL
# =============================================================================

@app.route('/api/export/template-equipment-control')
@login_required
def download_template_equipment_control():
    """Download do template para equipment-control"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    try:
        # Criar template para equipment-control
        template_data = {
            'tipo_device': ['iPhone', 'iPad', 'MacBook Pro'],
            'numero_serie': ['ABC123XYZ', 'DEF456UVW', 'GHI789RST'],
            'modelo': ['iPhone 15 Pro', 'iPad Pro 12.9', 'MacBook Pro M3'],
            'cor': ['Preto', 'Prata', 'Cinza-espacial'],
            'status': ['Disponível', 'Disponível', 'Manutenção'],
            'para_emprestimo': ['Sim', 'Sim', 'Não'],
            'responsavel': ['João Silva', 'Maria Santos', 'Técnico TI'],
            'local': ['Sala A101', 'Laboratório B', 'Oficina Técnica'],
            'convenio': ['Parceria Apple', 'Convênio Educ', 'Manutenção'],
            'observacao': ['Novo em folha', 'Com capa protetora', 'Em conserto'],
            'processador': ['Chip A17 Pro', 'Chip M2', 'Chip M3'],
            'memoria': ['8GB', '16GB', '32GB'],
            'armazenamento': ['256GB', '512GB', '1TB'],
            'tela': ['6.1"', '12.9"', '14.2"']
        }
        
        filename = 'template_equipment_control.xlsx'
        
        # Criar DataFrame e salvar como Excel
        df = pd.DataFrame(template_data)
        
        # Salvar em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Template', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao gerar template: {str(e)}'}), 500

# Rota alternativa para compatibilidade
@app.route('/download/template-equipment-control')
@login_required
def download_template_equipment_control_old():
    """Rota alternativa para compatibilidade com o frontend"""
    return download_template_equipment_control()

# =============================================================================
# ROTAS DE INVENTÁRIO
# =============================================================================

@app.route('/inventory')
@login_required
def inventory():
    if current_user.role != 'admin':
        flash('Acesso não autorizado! Apenas administradores podem acessar esta página.', 'error')
        return redirect(url_for('dashboard'))
    
    return render_template('inventory.html')

@app.route('/api/inventory', methods=['GET', 'POST'])
@csrf.exempt
@login_required
def api_inventory():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        if request.method == 'GET':
            cursor = get_db_cursor(conn)
            cursor.execute('SELECT * FROM inventory ORDER BY data_cadastro DESC, id DESC')
            items = cursor.fetchall()
            cursor.close()
            
            for item in items:
                item['etiquetado'] = bool(item['etiquetado'])
                if item['data_cadastro']:
                    item['data_cadastro'] = item['data_cadastro'].strftime('%Y-%m-%d')
            
            return jsonify({'success': True, 'data': items})
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados inválidos!'}), 400
        
        tombamento = data.get('tombamento')
        equipamento = data.get('equipamento')
        if not tombamento or not equipamento:
            return jsonify({'success': False, 'message': 'Tombamento e Equipamento são obrigatórios!'}), 400
        
        cursor = conn.cursor()
        cursor.execute('''INSERT INTO inventory
                          (tombamento, equipamento, carga, local, etiquetado, data_cadastro)
                          VALUES (%s, %s, %s, %s, %s, %s)''',
                       (tombamento,
                        equipamento,
                        data.get('carga', ''),
                        data.get('local', ''),
                        parse_boolean(data.get('etiquetado'), False),
                        data.get('data_cadastro', datetime.now().date())))
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Item cadastrado com sucesso!'})
    
    except IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Tombamento já cadastrado!'}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar inventário: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/inventory/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_inventory_item(item_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        if request.method == 'GET':
            cursor.execute('SELECT * FROM inventory WHERE id = %s', (item_id,))
            item = cursor.fetchone()
            cursor.close()
            if not item:
                return jsonify({'success': False, 'message': 'Item não encontrado!'}), 404
            item['etiquetado'] = bool(item['etiquetado'])
            if item['data_cadastro']:
                item['data_cadastro'] = item['data_cadastro'].strftime('%Y-%m-%d')
            return jsonify({'success': True, 'data': item})
        
        if request.method == 'PUT':
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'message': 'Dados inválidos!'}), 400
            
            tombamento = data.get('tombamento')
            equipamento = data.get('equipamento')
            if not tombamento or not equipamento:
                return jsonify({'success': False, 'message': 'Tombamento e Equipamento são obrigatórios!'}), 400
            
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM inventory WHERE tombamento = %s AND id != %s', (tombamento, item_id))
            existing = cursor.fetchone()
            if existing:
                return jsonify({'success': False, 'message': 'Tombamento já cadastrado em outro item!'}), 400
            
            cursor.execute('''UPDATE inventory SET
                              tombamento = %s,
                              equipamento = %s,
                              carga = %s,
                              local = %s,
                              etiquetado = %s
                              WHERE id = %s''',
                           (tombamento,
                            equipamento,
                            data.get('carga', ''),
                            data.get('local', ''),
                            parse_boolean(data.get('etiquetado'), False),
                            item_id))
            conn.commit()
            cursor.close()
            return jsonify({'success': True, 'message': 'Item atualizado com sucesso!'})
        
        cursor = conn.cursor()
        cursor.execute('DELETE FROM inventory WHERE id = %s', (item_id,))
        conn.commit()
        cursor.close()
        return jsonify({'success': True, 'message': 'Item excluído com sucesso!'})
    
    except IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Tombamento já cadastrado!'}), 400
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar item: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/inventory/delete-multiple', methods=['POST'])
@csrf.exempt
@login_required
def delete_multiple_inventory():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        data = request.get_json()
        ids = data.get('ids', [])
        if not ids:
            return jsonify({'success': False, 'message': 'Nenhum item selecionado!'}), 400
        
        cursor = conn.cursor()
        placeholders = ','.join(['%s'] * len(ids))
        cursor.execute(f"DELETE FROM inventory WHERE id IN ({placeholders})", ids)
        conn.commit()
        cursor.close()
        return jsonify({'success': True, 'message': f'{len(ids)} item(ns) excluído(s) com sucesso!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir itens: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/importar/inventory', methods=['POST'])
@login_required
def importar_inventory():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    try:
        criar_pasta_uploads()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            df = pd.read_csv(filepath, encoding='utf-8') if filename.endswith('.csv') else pd.read_excel(filepath)
            df.columns = [col.strip().lower() for col in df.columns]
            
            column_mapping = {
                'tombamento': ['tombamento', 'patrimonio', 'patrimônio'],
                'equipamento': ['equipamento', 'descricao', 'descrição', 'device'],
                'carga': ['carga', 'cargahoraria', 'carga_horaria'],
                'local': ['local', 'setor', 'ambiente'],
                'etiquetado': ['etiquetado', 'etiqueta', 'identificado']
            }
            
            mapped = {}
            for key, options in column_mapping.items():
                for option in options:
                    if option in df.columns:
                        mapped[key] = option
                        break
            
            required = ['tombamento', 'equipamento']
            missing = [col for col in required if col not in mapped]
            if missing:
                os.remove(filepath)
                return jsonify({'success': False, 'message': f'Colunas obrigatórias não encontradas: {", ".join(missing)}'})
            
            conn = get_db_connection()
            if not conn:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
            
            cursor = conn.cursor()
            sucessos = 0
            erros = []
            
            for index, row in df.iterrows():
                try:
                    tombamento = str(row[mapped['tombamento']]).strip()
                    equipamento = str(row[mapped['equipamento']]).strip()
                    carga = str(row[mapped['carga']]).strip() if 'carga' in mapped else ''
                    local = str(row[mapped['local']]).strip() if 'local' in mapped else ''
                    etiquetado = parse_boolean(row[mapped['etiquetado']]) if 'etiquetado' in mapped else False
                    
                    cursor.execute('''INSERT INTO inventory
                                      (tombamento, equipamento, carga, local, etiquetado)
                                      VALUES (%s, %s, %s, %s, %s)''',
                                   (tombamento, equipamento, carga, local, etiquetado))
                    sucessos += 1
                except IntegrityError:
                    erros.append(f"Linha {index + 2}: Tombamento duplicado - {tombamento}")
                except Exception as e:
                    erros.append(f"Linha {index + 2}: {str(e)}")
            
            conn.commit()
            cursor.close()
            conn.close()
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Importação concluída! {sucessos} item(ns) importado(s) com sucesso.',
                'detalhes': {
                    'sucessos': sucessos,
                    'erros': erros,
                    'total_linhas': len(df)
                }
            })
        
        return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})

# =============================================================================
# ROTA DE IMPORTACAO PARA EQUIPMENT CONTROL (NOVA)
# =============================================================================

@app.route('/api/importar/equipment-control', methods=['POST'])
@csrf.exempt
@login_required
def importar_equipment_control():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    try:
        criar_pasta_uploads()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Ler arquivo
            df = pd.read_csv(filepath, encoding='utf-8') if filename.endswith('.csv') else pd.read_excel(filepath)
            df.columns = [col.strip().lower() for col in df.columns]
            
            # Mapeamento flexível de colunas
            column_mapping = {
                'tipo_device': ['tipo_device', 'tipo', 'device', 'type'],
                'numero_serie': ['numero_serie', 'numero serie', 'serial', 'n_serie'],
                'modelo': ['modelo', 'model'],
                'cor': ['cor', 'color'],
                'status': ['status', 'situacao'],
                'para_emprestimo': ['para_emprestimo', 'emprestimo', 'disponivel_emprestimo', 'para_empresumo'],
                'responsavel': ['responsavel', 'responsável', 'responsible'],
                'local': ['local', 'location'],
                'convenio': ['convenio', 'convênio', 'partnership'],
                'observacao': ['observacao', 'observação', 'obs', 'notes'],
                'processador': ['processador', 'processor', 'chip'],
                'memoria': ['memoria', 'memory', 'ram'],
                'armazenamento': ['armazenamento', 'storage'],
                'tela': ['tela', 'screen', 'display']
            }
            
            # Encontrar colunas correspondentes
            mapped = {}
            for key, options in column_mapping.items():
                for option in options:
                    if option in df.columns:
                        mapped[key] = option
                        break
            
            # Verificar colunas obrigatórias
            required = ['tipo_device', 'numero_serie']
            missing = [col for col in required if col not in mapped]
            if missing:
                os.remove(filepath)
                return jsonify({'success': False, 'message': f'Colunas obrigatórias não encontradas: {", ".join(missing)}'})
            
            conn = get_db_connection()
            if not conn:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
            
            cursor = get_db_cursor(conn)
            sucessos = 0
            erros = []
            
            for index, row in df.iterrows():
                try:
                    # Campos obrigatórios
                    tipo_device = str(row[mapped['tipo_device']]).strip()
                    numero_serie = str(row[mapped['numero_serie']]).strip()
                    
                    # Campos opcionais com valores padrão
                    modelo = str(row[mapped['modelo']]).strip() if 'modelo' in mapped else ''
                    cor = str(row[mapped['cor']]).strip() if 'cor' in mapped else ''
                    status = str(row[mapped['status']]).strip() if 'status' in mapped else 'Disponível'
                    responsavel = str(row[mapped['responsavel']]).strip() if 'responsavel' in mapped else ''
                    local = str(row[mapped['local']]).strip() if 'local' in mapped else ''
                    convenio = str(row[mapped['convenio']]).strip() if 'convenio' in mapped else ''
                    observacao = str(row[mapped['observacao']]).strip() if 'observacao' in mapped else ''
                    processador = str(row[mapped['processador']]).strip() if 'processador' in mapped else ''
                    memoria = str(row[mapped['memoria']]).strip() if 'memoria' in mapped else ''
                    armazenamento = str(row[mapped['armazenamento']]).strip() if 'armazenamento' in mapped else ''
                    tela = str(row[mapped['tela']]).strip() if 'tela' in mapped else ''
                    
                    # Processar para_emprestimo
                    if 'para_emprestimo' in mapped:
                        para_emprestimo_val = row[mapped['para_emprestimo']]
                        para_emprestimo = parse_boolean(para_emprestimo_val, True)
                    else:
                        para_emprestimo = True
                    
                    # Validar status
                    if status not in ['Disponível', 'Emprestado', 'Manutenção', 'Reservado']:
                        status = 'Disponível'
                    
                    # Inserir no banco
                    cursor.execute('''INSERT INTO equipment_control 
                                    (tipo_device, numero_serie, modelo, cor, status, para_emprestimo, 
                                     responsavel, local, convenio, observacao, processador, memoria, 
                                     armazenamento, tela, data_cadastro)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                 (tipo_device, numero_serie, modelo, cor, status, para_emprestimo,
                                  responsavel, local, convenio, observacao, processador, memoria,
                                  armazenamento, tela, datetime.now().date()))
                    
                    # Sincronizar com a tabela devices
                    normalized_data = {
                        'tipo_device': tipo_device,
                        'numero_serie': numero_serie,
                        'modelo': modelo,
                        'cor': cor,
                        'status': status,
                        'para_emprestimo': para_emprestimo,
                        'responsavel': responsavel,
                        'local': local,
                        'convenio': convenio,
                        'observacao': observacao,
                        'processador': processador,
                        'memoria': memoria,
                        'armazenamento': armazenamento,
                        'tela': tela
                    }
                    upsert_device_from_equipment(conn, normalized_data)
                    
                    sucessos += 1
                    
                except IntegrityError:
                    erros.append(f"Linha {index + 2}: Número de série duplicado - {numero_serie}")
                except Exception as e:
                    erros.append(f"Linha {index + 2}: {str(e)}")
            
            conn.commit()
            cursor.close()
            conn.close()
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Importação concluída! {sucessos} equipment(s) importado(s) com sucesso.',
                'detalhes': {
                    'sucessos': sucessos,
                    'erros': erros,
                    'total_linhas': len(df)
                }
            })
        
        return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})
                
# =============================================================================        
# NOVA ROTA: DELETAR MÚLTIPLOS EQUIPMENTS
# =============================================================================

@app.route('/api/equipment-control/delete-multiple', methods=['POST'])
@csrf.exempt
@login_required
def delete_multiple_equipment():
    """Excluir múltiplos equipments de uma vez"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        equipment_ids = data.get('ids', [])
        
        if not equipment_ids:
            return jsonify({'success': False, 'message': 'Nenhum equipment selecionado!'})
        
        cursor = get_db_cursor(conn)
        
        # Primeiro, buscar os números de série para remover da tabela devices
        placeholders = ','.join(['%s'] * len(equipment_ids))
        cursor.execute(f"SELECT numero_serie FROM equipment_control WHERE id IN ({placeholders})", equipment_ids)
        results = cursor.fetchall()
        numeros_serie = [result['numero_serie'] for result in results] if results else []
        
        # Executar delete múltiplo
        cursor.execute(f"DELETE FROM equipment_control WHERE id IN ({placeholders})", equipment_ids)
        
        # Remover da tabela devices
        if numeros_serie:
            placeholders_devices = ','.join(['%s'] * len(numeros_serie))
            cursor.execute(f"DELETE FROM devices WHERE numero_serie IN ({placeholders_devices})", numeros_serie)
        
        conn.commit()
        cursor.close()
        
        return jsonify({
            'success': True, 
            'message': f'{len(equipment_ids)} equipment(s) excluído(s) com sucesso!'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao excluir equipment(s): {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE ALUNOS (ATUALIZADAS PARA MYSQL)
# =============================================================================

@app.route('/alunos')
@login_required
def alunos():
    conn = get_db_connection()
    if not conn:
        flash('Erro de conexão com o banco de dados!', 'error')
        return render_template('alunos.html', alunos=[])
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('''SELECT * FROM alunos ORDER BY nome''')
        alunos_data = cursor.fetchall()
        cursor.close()
        
        alunos_list = []
        for aluno in alunos_data:
            alunos_list.append({
                'id': aluno['id'],
                'nome': aluno['nome'],
                'cpf': aluno['cpf'],
                'telefone': aluno['telefone'],
                'email': aluno['email'],
                'endereco': aluno['endereco'],
                'tem_apple_id': 'Sim' if aluno['tem_apple_id'] else 'Não',
                'apple_id': aluno['apple_id'] or '-',
                'tipo_aluno': aluno['tipo_aluno'],
                'tipo_aluno': aluno['tipo_aluno'],
                'data_inicio': aluno['data_inicio'].isoformat() if aluno['data_inicio'] else '',
                'foto_path': aluno.get('foto_path')
            })
        
        print(f"DEBUG: Fetched {len(alunos_list)} students from database")
        if alunos_list:
            print(f"DEBUG: First student: {alunos_list[0]}")
        
        return render_template('alunos.html', alunos=alunos_list)
    
    except Exception as e:
        flash(f'Erro ao carregar alunos: {str(e)}', 'error')
        return render_template('alunos.html', alunos=[])
    finally:
        if conn:
            conn.close()

# API para listar alunos paginado
@app.route('/api/alunos/pagina', methods=['GET'])
@login_required
def api_alunos_pagina():
    """API para listar alunos com paginação"""
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        # Get total count
        cursor.execute('SELECT COUNT(*) as total FROM alunos')
        total = cursor.fetchone()['total']
        
        # Get paginated data
        cursor.execute('SELECT * FROM alunos ORDER BY nome LIMIT %s OFFSET %s', (limit, offset))
        alunos_data = cursor.fetchall()
        cursor.close()
        
        alunos_list = []
        for aluno in alunos_data:
            alunos_list.append({
                'id': aluno['id'],
                'nome': aluno['nome'],
                'cpf': aluno['cpf'] or '',
                'telefone': aluno['telefone'] or '',
                'email': aluno['email'],
                'endereco': aluno['endereco'] or '',
                'tem_apple_id': bool(aluno['tem_apple_id']),
                'apple_id': aluno['apple_id'] or '-',
                'tipo_aluno': aluno['tipo_aluno'],
                'data_inicio': aluno['data_inicio'].isoformat() if aluno['data_inicio'] else '',
                'foto_path': aluno.get('foto_path'),
                'status_aluno': aluno.get('status_aluno', 'Ativo'),
                'curso': aluno.get('curso', 'Apple Developer Academy')
            })
        
        return jsonify({
            'success': True,
            'data': alunos_list,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar alunos: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/alunos/lista', methods=['GET'])
@login_required
def api_alunos_lista():
    """API para listar todos os alunos (usada em selects/modais)"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('SELECT id, nome FROM alunos ORDER BY nome ASC')
        rows = cursor.fetchall()
        
        # Garantir que retorno seja uma lista de dicionários, independente do tipo de cursor
        alunos = []
        for row in rows:
            if isinstance(row, dict):
                alunos.append(row)
            elif isinstance(row, (list, tuple)) and len(row) >= 2:
                alunos.append({'id': row[0], 'nome': row[1]})
            else:
                # Fallback genérico para outros formatos
                try:
                    alunos.append({'id': row['id'], 'nome': row['nome']})
                except:
                    continue
        
        return jsonify({'success': True, 'data': alunos})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()


@app.route('/api/alunos', methods=['POST'])
@csrf.exempt
@login_required
def criar_aluno():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        # Verificar se é multipart/form-data (com arquivo) ou JSON
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form
        else:
            data = request.get_json()
        
        nome = data.get('nome')
        cpf = data.get('cpf')
        telefone = data.get('telefone')
        email = data.get('email')
        endereco = data.get('endereco')
        tem_apple_id = data.get('tem_apple_id') == True
        apple_id = data.get('apple_id')
        tipo_aluno = data.get('tipo_aluno')
        tipo_aluno = data.get('tipo_aluno')
        data_inicio = data.get('data_inicio')
        
        # Processar upload de foto se houver
        foto_path = None
        if 'foto' in request.files:
            file = request.files['foto']
            if file and file.filename != '' and allowed_file_image(file.filename):
                filename = secure_filename(f"aluno_{cpf}_{int(datetime.now().timestamp())}.{file.filename.rsplit('.', 1)[1].lower()}")
                # Criar diretório se não existir
                alunos_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'alunos')
                if not os.path.exists(alunos_upload_dir):
                    os.makedirs(alunos_upload_dir)
                
                file.save(os.path.join(alunos_upload_dir, filename))
                foto_path = f"uploads/alunos/{filename}"

        cursor = conn.cursor()
        
        cursor.execute('''INSERT INTO alunos 
                        (nome, cpf, telefone, email, endereco, tem_apple_id, apple_id, tipo_aluno, data_inicio, foto_path)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                     (nome, cpf, telefone, email, endereco, tem_apple_id, apple_id, tipo_aluno, data_inicio, foto_path))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Aluno cadastrado com sucesso!'})
    
    except IntegrityError as e:
        conn.rollback()
        if 'email' in str(e):
            return jsonify({'success': False, 'message': 'E-mail já cadastrado!'})
        elif 'cpf' in str(e):
            return jsonify({'success': False, 'message': 'CPF já cadastrado!'})
        else:
            return jsonify({'success': False, 'message': 'Dados duplicados!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao cadastrar aluno: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# API PARA ALUNOS (EDIÇÃO E EXCLUSÃO) - ATUALIZADAS PARA MYSQL
# =============================================================================

@app.route('/api/alunos/<int:aluno_id>', methods=['GET', 'PUT', 'DELETE'])
@csrf.exempt
@login_required
def api_aluno(aluno_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        if request.method == 'GET':
            # Buscar aluno específico
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM alunos WHERE id = %s", (aluno_id,))
            aluno = cursor.fetchone()
            cursor.close()
            
            if aluno:
                aluno_data = {
                    'id': aluno['id'],
                    'nome': aluno['nome'],
                    'cpf': aluno['cpf'],
                    'telefone': aluno['telefone'],
                    'email': aluno['email'],
                    'endereco': aluno['endereco'],
                    'tem_apple_id': bool(aluno['tem_apple_id']),
                    'apple_id': aluno['apple_id'],
                    'tipo_aluno': aluno['tipo_aluno'],
                    'tipo_aluno': aluno['tipo_aluno'],
                    'data_inicio': aluno['data_inicio'].isoformat() if aluno['data_inicio'] else '',
                    'foto_path': aluno.get('foto_path')
                }
                return jsonify({'success': True, 'data': aluno_data})
            else:
                return jsonify({'success': False, 'message': 'Aluno não encontrado!'})
        
        elif request.method == 'PUT':
            # Atualizar aluno
            # Verificar se é multipart/form-data (com arquivo) ou JSON
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form
            else:
                data = request.get_json()
            
            
            nome = data.get('nome')
            cpf = data.get('cpf')
            telefone = data.get('telefone')
            email = data.get('email')
            endereco = data.get('endereco')
            tem_apple_id = data.get('tem_apple_id') == True
            apple_id = data.get('apple_id')
            tipo_aluno = data.get('tipo_aluno')
            data_inicio = data.get('data_inicio')
            
            cursor = conn.cursor()
            
            # Verificar se email já existe (excluindo o próprio aluno)
            cursor.execute("SELECT id FROM alunos WHERE email = %s AND id != %s", (email, aluno_id))
            existing_email = cursor.fetchone()
            if existing_email:
                return jsonify({'success': False, 'message': 'E-mail já cadastrado em outro aluno!'})
            
            # Verificar se CPF já existe (excluindo o próprio aluno)
            if cpf:
                cursor.execute("SELECT id FROM alunos WHERE cpf = %s AND id != %s", (cpf, aluno_id))
                existing_cpf = cursor.fetchone()
                if existing_cpf:
                    return jsonify({'success': False, 'message': 'CPF já cadastrado em outro aluno!'})
            
            cursor.execute('''UPDATE alunos SET 
                            nome = %s, cpf = %s, telefone = %s, email = %s, endereco = %s, 
                            tem_apple_id = %s, apple_id = %s, tipo_aluno = %s, data_inicio = %s
                            WHERE id = %s''',
                         (nome, cpf, telefone, email, endereco, tem_apple_id, apple_id, tipo_aluno, data_inicio, aluno_id))
            
            # Processar upload de foto se houver
            if 'foto' in request.files:
                file = request.files['foto']
                if file and file.filename != '' and allowed_file_image(file.filename):
                    # Nome único para a foto
                    filename = secure_filename(f"aluno_{cpf}_{int(datetime.now().timestamp())}.{file.filename.rsplit('.', 1)[1].lower()}")
                    
                    # Criar diretório se não existir
                    alunos_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'alunos')
                    if not os.path.exists(alunos_upload_dir):
                        os.makedirs(alunos_upload_dir)
                    
                    file.save(os.path.join(alunos_upload_dir, filename))
                    foto_path = f"uploads/alunos/{filename}"
                    
                    # Atualizar caminho da foto no banco
                    cursor.execute("UPDATE alunos SET foto_path = %s WHERE id = %s", (foto_path, aluno_id))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Aluno atualizado com sucesso!'})
        
        elif request.method == 'DELETE':
            # Excluir aluno
            cursor = get_db_cursor(conn)
            
            # Verificar se o aluno está em um empréstimo ativo
            cursor.execute("SELECT id FROM emprestimos WHERE aluno_id = %s AND status = 'Ativo'", (aluno_id,))
            emprestimo_ativo = cursor.fetchone()
            
            if emprestimo_ativo:
                return jsonify({'success': False, 'message': 'Não é possível excluir um aluno que possui empréstimo ativo!'})
            
            cursor.execute("DELETE FROM alunos WHERE id = %s", (aluno_id,))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Aluno excluído com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar aluno: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/alunos/bulk-delete', methods=['POST'])
@csrf.exempt
@login_required
def bulk_delete_alunos():
    data = request.get_json()
    aluno_ids = data.get('ids', [])
    
    if not aluno_ids:
        return jsonify({'success': False, 'message': 'Nenhum ID fornecido.'}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
        
    try:
        cursor = get_db_cursor(conn)
        
        # Check for active loans first
        if not aluno_ids:
            return jsonify({'success': False, 'message': 'Nenhum ID fornecido.'}), 400
            
        format_strings = ','.join(['%s'] * len(aluno_ids))
        cursor.execute(f"SELECT aluno_id FROM emprestimos WHERE aluno_id IN ({format_strings}) AND status = 'Ativo'", tuple(aluno_ids))
        active_loans = cursor.fetchall()
        
        if active_loans:
            cursor.close()
            return jsonify({
                'success': False, 
                'message': 'Não é possível excluir alunos com empréstimos ativos!'
            }), 400
            
        # Delete related data in emprestimos_livros first
        cursor.execute(f"DELETE FROM emprestimos_livros WHERE aluno_id IN ({format_strings})", tuple(aluno_ids))
        
        # Delete related data in emprestimos
        cursor.execute(f"DELETE FROM emprestimos WHERE aluno_id IN ({format_strings})", tuple(aluno_ids))
        
        # Finally delete students
        cursor.execute(f"DELETE FROM alunos WHERE id IN ({format_strings})", tuple(aluno_ids))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': f'{len(aluno_ids)} alunos excluídos com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar exclusão em massa: {str(e)}'}), 500
    finally:
        if conn: conn.close()

# =============================================================================
# ROTAS DE DEVICES ATUALIZADAS COM OBSERVAÇÃO (MYSQL)
# =============================================================================

@app.route('/devices')
@login_required
def devices():
    conn = get_db_connection()
    if not conn:
        flash('Erro de conexão com o banco de dados!', 'error')
        return render_template('devices.html', devices=[])
    
    try:
        cursor = get_db_cursor(conn)
        
        # Buscar devices da tabela devices com para_emprestimo = true E status = 'Disponível'
        cursor.execute('''SELECT * FROM devices WHERE para_emprestimo = 1 AND status = 'Disponível' ORDER BY tipo, nome''')
        devices_data = cursor.fetchall()

        # Buscar equipments do equipment_control com status='Disponível' e para_emprestimo=1
        cursor.execute('''SELECT * FROM equipment_control 
                          WHERE status = 'Disponível' AND para_emprestimo = 1 
                          ORDER BY tipo_device, modelo''')
        equipments_data = cursor.fetchall()
        print(f"DEBUG equipment_control: Total de {len(equipments_data)} equipments encontrados")
        if equipments_data:
            print(f"DEBUG: Primeiro equipment: {equipments_data[0]}")
        else:
            print("DEBUG: NENHUM equipment encontrado na tabela equipment_control!")
        
        cursor.close()
        
        devices_list = []
        
        # Adicionar devices da tabela devices
        for device in devices_data:
            devices_list.append({
                'id': device['id'],
                'tipo': device['tipo'],
                'modelo': device['modelo'] or '',
                'cor': device['cor'] or '',
                'polegadas': device['polegadas'] or '',
                'ano': device['ano'] or '',
                'nome': device['nome'] or '',
                'chip': device['chip'] or '',
                'memoria': device['memoria'] or '',
                'numero_serie': device['numero_serie'],
                'versao_os': device['versao_os'] or '',
                'status': device['status'],
                'para_emprestimo': 'Sim' if device['para_emprestimo'] else 'Não',
                'observacao': device.get('observacao', '') or ''
            })
        
        # Adicionar equipments do equipment_control que atendem aos critérios
        for equipment in equipments_data:
            # Verificar se já existe na lista (por número de série)
            numero_serie_eq = equipment['numero_serie']
            ja_existe = any(d.get('numero_serie') == numero_serie_eq for d in devices_list)
            
            # Só adicionar se não existir ainda
            if not ja_existe:
                devices_list.append({
                    'id': -equipment['id'],  # ID negativo para identificar origem
                    'tipo': equipment['tipo_device'] or 'Outro',
                    'modelo': equipment.get('modelo', '') or '',
                    'cor': equipment.get('cor', '') or '',
                    'polegadas': equipment.get('polegadas', '') or '',
                    'ano': equipment.get('ano', '') or '',
                    'nome': (equipment.get('local') or equipment.get('responsavel') or f"{equipment['tipo_device']} - {equipment['numero_serie']}") or '',
                    'chip': equipment.get('processador', '') or '',
                    'memoria': equipment.get('memoria', '') or '',
                    'numero_serie': equipment['numero_serie'],
                    'versao_os': equipment.get('versao_os', '') or '',
                    'status': equipment['status'],
                    'para_emprestimo': 'Sim' if equipment['para_emprestimo'] else 'Não',
                    'observacao': equipment.get('observacao', '') or ''
                })
        
        return render_template('devices.html', devices=devices_list)
    
    except Exception as e:
        flash(f'Erro ao carregar devices: {str(e)}', 'error')
        return render_template('devices.html', devices=[])
    finally:
        if conn:
            conn.close()

@app.route('/api/devices', methods=['GET', 'POST'])
@login_required
def criar_device():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        if request.method == 'GET':
            # Retornar lista de devices (apenas com para_emprestimo = true)
            cursor = get_db_cursor(conn)
            cursor.execute('''SELECT * FROM devices WHERE para_emprestimo = 1 ORDER BY tipo, nome''')
            devices_data = cursor.fetchall()
            
            # Buscar equipments do equipment_control com status='Emprestado' e para_emprestimo=true
            # Incluir TODOS os equipments com status='Emprestado' e para_emprestimo=true
            cursor.execute('''
                SELECT ec.*, 'equipment_control' as origem
                FROM equipment_control ec
                WHERE ec.status = 'Emprestado' 
                AND (ec.para_emprestimo = 1 OR ec.para_emprestimo = TRUE)
                ORDER BY ec.tipo_device, ec.numero_serie
            ''')
            equipments_data = cursor.fetchall()
            
            cursor.close()
            
            devices_list = []
            
            # Adicionar devices da tabela devices
            for device in devices_data:
                devices_list.append({
                    'id': device['id'],
                    'tipo': device['tipo'],
                    'modelo': device['modelo'],
                    'cor': device['cor'],
                    'polegadas': device['polegadas'],
                    'ano': device['ano'],
                    'nome': device['nome'],
                    'chip': device['chip'],
                    'memoria': device['memoria'],
                    'numero_serie': device['numero_serie'],
                    'versao_os': device['versao_os'],
                    'status': device['status'],
                    'para_emprestimo': bool(device['para_emprestimo']),
                    'observacao': device.get('observacao', '')
                })
            
            # Adicionar equipments do equipment_control
            for equipment in equipments_data:
                devices_list.append({
                    'id': -equipment['id'],  # ID negativo para identificar origem
                    'tipo': equipment['tipo_device'] or 'Outro',
                    'modelo': equipment.get('modelo', ''),
                    'cor': equipment.get('cor', ''),
                    'polegadas': equipment.get('polegadas', ''),
                    'ano': equipment.get('ano', ''),
                    'nome': equipment.get('local') or equipment.get('responsavel') or f"{equipment['tipo_device']} - {equipment['numero_serie']}",
                    'chip': equipment.get('processador', ''),
                    'memoria': equipment.get('memoria', ''),
                    'numero_serie': equipment['numero_serie'],
                    'versao_os': equipment.get('versao_os', ''),
                    'status': equipment['status'],
                    'para_emprestimo': bool(equipment['para_emprestimo']),
                    'observacao': equipment.get('observacao', '')
                })
            
            return jsonify(devices_list)
        
        data = request.get_json()
        
        tipo = data.get('tipo')
        modelo = data.get('modelo')
        cor = data.get('cor')
        polegadas = data.get('polegadas')
        ano = data.get('ano')
        nome = data.get('nome')
        chip = data.get('chip')
        memoria = data.get('memoria')
        numero_serie = data.get('numero_serie')
        versao_os = data.get('versao_os')
        status = data.get('status', 'Disponível')
        para_emprestimo = data.get('para_emprestimo') == True
        observacao = data.get('observacao', '')
        
        cursor = conn.cursor()
        
        cursor.execute('''INSERT INTO devices 
                        (tipo, modelo, cor, polegadas, ano, nome, chip, memoria, numero_serie, versao_os, status, para_emprestimo, observacao)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                     (tipo, modelo, cor, polegadas, ano, nome, chip, memoria, numero_serie, versao_os, status, para_emprestimo, observacao))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Device cadastrado com sucesso!'})
    
    except IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Número de série já cadastrado!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao cadastrar device: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# API PARA DEVICES (EDIÇÃO E EXCLUSÃO) ATUALIZADA COM OBSERVAÇÃO (MYSQL)
# =============================================================================

@app.route('/api/devices/<int:device_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_device(device_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        if request.method == 'GET':
            # Buscar device específico
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM devices WHERE id = %s", (device_id,))
            device = cursor.fetchone()
            cursor.close()
            
            if device:
                device_data = {
                    'id': device['id'],
                    'tipo': device['tipo'],
                    'modelo': device['modelo'],
                    'cor': device['cor'],
                    'polegadas': device['polegadas'],
                    'ano': device['ano'],
                    'nome': device['nome'],
                    'chip': device['chip'],
                    'memoria': device['memoria'],
                    'numero_serie': device['numero_serie'],
                    'versao_os': device['versao_os'],
                    'status': device['status'],
                    'para_emprestimo': bool(device['para_emprestimo']),
                    'observacao': device.get('observacao', '')
                }
                return jsonify({'success': True, 'data': device_data})
            else:
                return jsonify({'success': False, 'message': 'Device não encontrado!'})
        
        elif request.method == 'PUT':
            # Atualizar device
            data = request.get_json()
            
            tipo = data.get('tipo')
            modelo = data.get('modelo')
            cor = data.get('cor')
            polegadas = data.get('polegadas')
            ano = data.get('ano')
            nome = data.get('nome')
            chip = data.get('chip')
            memoria = data.get('memoria')
            numero_serie = data.get('numero_serie')
            versao_os = data.get('versao_os')
            status = data.get('status')
            para_emprestimo = data.get('para_emprestimo') == True
            observacao = data.get('observacao', '')
            
            cursor = conn.cursor()
            
            # Se para_emprestimo for false, remover o device da tabela
            if not para_emprestimo:
                cursor.execute("DELETE FROM devices WHERE id = %s", (device_id,))
                conn.commit()
                cursor.close()
                return jsonify({'success': True, 'message': 'Device removido da lista de empréstimos!'})
            
            # Verificar se número de série já existe (excluindo o próprio device)
            cursor.execute("SELECT id FROM devices WHERE numero_serie = %s AND id != %s", (numero_serie, device_id))
            existing = cursor.fetchone()
            if existing:
                return jsonify({'success': False, 'message': 'Número de série já cadastrado em outro device!'})
            
            cursor.execute('''UPDATE devices SET 
                            tipo = %s, modelo = %s, cor = %s, polegadas = %s, ano = %s, nome = %s, 
                            chip = %s, memoria = %s, numero_serie = %s, versao_os = %s, status = %s, para_emprestimo = %s, observacao = %s
                            WHERE id = %s''',
                         (tipo, modelo, cor, polegadas, ano, nome, chip, memoria, numero_serie, 
                          versao_os, status, para_emprestimo, observacao, device_id))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Device atualizado com sucesso!'})
        
        elif request.method == 'DELETE':
            # Excluir device
            cursor = conn.cursor()
            
            # Verificar se o device está em um empréstimo ativo
            cursor.execute("SELECT id FROM emprestimos WHERE device_id = %s AND status = 'Ativo'", (device_id,))
            emprestimo_ativo = cursor.fetchone()
            
            if emprestimo_ativo:
                return jsonify({'success': False, 'message': 'Não é possível excluir um device que está em empréstimo ativo!'})
            
            cursor.execute("DELETE FROM devices WHERE id = %s", (device_id,))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Device excluído com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar device: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/devices/delete-multiple', methods=['POST'])
@csrf.exempt
@login_required
def delete_multiple_devices():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        device_ids = data.get('ids', [])
        
        if not device_ids:
            return jsonify({'success': False, 'message': 'Nenhum device selecionado!'}), 400
        
        cursor = conn.cursor()
        placeholders = ','.join(['%s'] * len(device_ids))
        
        cursor.execute(f'''SELECT device_id FROM emprestimos 
                           WHERE device_id IN ({placeholders}) AND status = 'Ativo' ''', device_ids)
        ativos = cursor.fetchall()
        if ativos:
            return jsonify({'success': False, 'message': 'Existe(m) device(s) com empréstimo ativo. Finalize antes de excluir.'}), 400
        
        cursor.execute(f"DELETE FROM devices WHERE id IN ({placeholders})", device_ids)
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': f'{len(device_ids)} device(s) excluído(s) com sucesso!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir devices: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE EMPRÉSTIMOS (ATUALIZADAS COM ASSINATURA - MYSQL)
# =============================================================================

@app.route('/emprestimos')
@login_required
def emprestimos():
    conn = get_db_connection()
    if not conn:
        flash('Erro de conexão com o banco de dados!', 'error')
        return render_template('emprestimos.html', emprestimos=[], alunos=[], devices=[])
    
    try:
        cursor = get_db_cursor(conn)
        
        # Buscar empréstimos com informações dos alunos e devices
        cursor.execute('''SELECT e.*, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo
                         FROM emprestimos e
                         LEFT JOIN alunos a ON e.aluno_id = a.id
                         LEFT JOIN devices d ON e.device_id = d.id
                         ORDER BY e.data_retirada DESC''')
        
        emprestimos_data = cursor.fetchall()
        
        # Buscar alunos para o dropdown
        cursor.execute("SELECT id, nome, tipo_aluno FROM alunos ORDER BY nome")
        alunos = cursor.fetchall()
        
        # Buscar devices disponíveis para empréstimo
        cursor.execute("SELECT id, nome, tipo FROM devices WHERE status = 'Disponível' AND para_emprestimo = 1 ORDER BY nome")
        devices = cursor.fetchall()
        
        cursor.close()
        
        emprestimos_list = []
        for emp in emprestimos_data:
            emprestimos_list.append({
                'id': emp['id'],
                'aluno_id': emp['aluno_id'],
                'device_id': emp['device_id'],
                'acessorios': emp['acessorios'],
                'data_retirada': emp['data_retirada'],
                'data_devolucao': emp['data_devolucao'],
                'assinatura': emp['assinatura'],
                'status': emp['status'],
                'aluno_nome': emp['aluno_nome'],
                'device_nome': emp['device_nome'],
                'device_tipo': emp['device_tipo']
            })
        
        return render_template('emprestimos.html', 
                             emprestimos=emprestimos_list,
                             alunos=alunos,
                             devices=devices)
    
    except Exception as e:
        flash(f'Erro ao carregar empréstimos: {str(e)}', 'error')
        return render_template('emprestimos.html', emprestimos=[], alunos=[], devices=[])
    finally:
        if conn:
            conn.close()

@app.route('/api/emprestimos', methods=['GET'])
@login_required
def api_emprestimos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
        
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('''SELECT e.*, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo
                         FROM emprestimos e
                         LEFT JOIN alunos a ON e.aluno_id = a.id
                         LEFT JOIN devices d ON e.device_id = d.id
                         ORDER BY e.data_retirada DESC''')
        emprestimos = cursor.fetchall()
        cursor.close()
        
        # Format dates
        for emp in emprestimos:
            if emp['data_retirada']:
                emp['data_retirada'] = emp['data_retirada'].isoformat()
            if emp['data_devolucao']:
                 emp['data_devolucao'] = emp['data_devolucao'].isoformat()
        
        return jsonify({'success': True, 'data': emprestimos})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao listar empréstimos: {str(e)}'}), 500
    finally:
        if conn:
             conn.close()

@app.route('/api/emprestimos/lista', methods=['GET'])
@login_required
def api_emprestimos_lista():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
        
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('''SELECT e.*, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo
                         FROM emprestimos e
                         LEFT JOIN alunos a ON e.aluno_id = a.id
                         LEFT JOIN devices d ON e.device_id = d.id
                         ORDER BY e.data_retirada DESC''')
        emprestimos = cursor.fetchall()
        cursor.close()
        
        # Format dates
        for emp in emprestimos:
            if emp['data_retirada']:
                emp['data_retirada'] = emp['data_retirada'].isoformat()
            if emp['data_devolucao']:
                 emp['data_devolucao'] = emp['data_devolucao'].isoformat()
        
        return jsonify({'success': True, 'data': emprestimos})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao listar empréstimos: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/emprestimos', methods=['POST'])
@csrf.exempt
@login_required
def criar_emprestimo():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        
        aluno_id = data.get('aluno_id')
        device_id = data.get('device_id')
        acessorios = data.get('acessorios', '')
        data_retirada = data.get('data_retirada')
        data_devolucao = data.get('data_devolucao')
        assinatura = data.get('assinatura', '')
        
        cursor = conn.cursor()
        
        # Validar se aluno existe
        cursor.execute("SELECT id FROM alunos WHERE id = %s", (aluno_id,))
        aluno = cursor.fetchone()
        if not aluno:
            return jsonify({'success': False, 'message': 'Aluno não encontrado!'})
        
        # Validar se device existe e está disponível
        cursor.execute("SELECT id, status FROM devices WHERE id = %s AND status = 'Disponível' AND para_emprestimo = 1", (device_id,))
        device = cursor.fetchone()
        if not device:
            return jsonify({'success': False, 'message': 'Device não encontrado ou não disponível para empréstimo!'})
        
        # Criar empréstimo COM ASSINATURA
        cursor.execute('''INSERT INTO emprestimos 
                        (aluno_id, device_id, acessorios, data_retirada, data_devolucao, assinatura, status)
                        VALUES (%s, %s, %s, %s, %s, %s, 'Ativo')''',
                     (aluno_id, device_id, acessorios, data_retirada, data_devolucao, assinatura))
        
        # Atualizar status do device para "Emprestado"
        cursor.execute('''UPDATE devices SET status = 'Emprestado' WHERE id = %s''', (device_id,))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Empréstimo registrado com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao registrar empréstimo: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/emprestimos/<int:emprestimo_id>/devolver', methods=['POST'])
@csrf.exempt
@login_required
def devolver_emprestimo(emprestimo_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        cursor = conn.cursor()
        
        # Buscar device_id do empréstimo
        cursor.execute('SELECT device_id FROM emprestimos WHERE id = %s', (emprestimo_id,))
        result = cursor.fetchone()
        
        if result:
            device_id = result[0]
            
            # Atualizar status do empréstimo
            cursor.execute("UPDATE emprestimos SET status = 'Finalizado' WHERE id = %s", (emprestimo_id,))
            
            # Atualizar status do device para "Disponível"
            cursor.execute("UPDATE devices SET status = 'Disponível' WHERE id = %s", (device_id,))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Devolução registrada com sucesso!'})
        else:
            return jsonify({'success': False, 'message': 'Empréstimo não encontrado!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao registrar devolução: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTA PARA ASSINATURA DIGITAL (NOVA)
# =============================================================================

@app.route('/api/emprestimos/assinatura', methods=['POST'])
@csrf.exempt
@login_required
def adicionar_assinatura():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        
        emprestimo_id = data.get('emprestimo_id')
        tipo_assinatura = data.get('tipo_assinatura')
        assinatura = data.get('assinatura')
        
        cursor = conn.cursor()
        
        # Verificar se o empréstimo existe
        cursor.execute("SELECT id FROM emprestimos WHERE id = %s", (emprestimo_id,))
        emprestimo = cursor.fetchone()
        
        if not emprestimo:
            return jsonify({'success': False, 'message': 'Empréstimo não encontrado!'})
        
        # Atualizar a assinatura no empréstimo
        cursor.execute('''UPDATE emprestimos SET assinatura = %s WHERE id = %s''',
                     (assinatura, emprestimo_id))
        
        conn.commit()
        cursor.close()
        
        tipo_texto = "de retirada" if tipo_assinatura == "retirada" else "de devolução"
        return jsonify({'success': True, 'message': f'Assinatura {tipo_texto} adicionada com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao adicionar assinatura: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTA PARA EXCLUIR EMPRÉSTIMO (NOVA)
# =============================================================================

@app.route('/api/emprestimos/<int:emprestimo_id>', methods=['DELETE'])
@login_required
def excluir_emprestimo(emprestimo_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        cursor = conn.cursor()
        
        # Buscar device_id do empréstimo antes de deletar
        cursor.execute('SELECT device_id, status FROM emprestimos WHERE id = %s', (emprestimo_id,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'success': False, 'message': 'Empréstimo não encontrado!'})
        
        device_id = result[0]
        status_emprestimo = result[1]
        
        # Deletar o empréstimo
        cursor.execute('DELETE FROM emprestimos WHERE id = %s', (emprestimo_id,))
        
        # Se o empréstimo estava ativo, atualizar o status do device para "Disponível"
        if status_emprestimo == 'Ativo' and device_id:
            cursor.execute("UPDATE devices SET status = 'Disponível' WHERE id = %s", (device_id,))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Empréstimo excluído com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir empréstimo: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTA PARA EXCLUIR MÚLTIPLOS EMPRÉSTIMOS (NOVA)
# =============================================================================

@app.route('/api/emprestimos/delete-multiple', methods=['POST'])
@csrf.exempt
@login_required
def delete_multiple_emprestimos():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        emprestimo_ids = data.get('ids', [])
        
        if not emprestimo_ids:
            return jsonify({'success': False, 'message': 'Nenhum empréstimo selecionado!'}), 400
        
        cursor = conn.cursor()
        
        # Buscar device_ids dos empréstimos ativos antes de deletar
        placeholders = ','.join(['%s'] * len(emprestimo_ids))
        cursor.execute(f'''SELECT device_id FROM emprestimos 
                           WHERE id IN ({placeholders}) AND status = 'Ativo' ''', emprestimo_ids)
        devices_ativos = cursor.fetchall()
        device_ids_ativos = [row[0] for row in devices_ativos if row[0]]
        
        # Deletar os empréstimos
        cursor.execute(f"DELETE FROM emprestimos WHERE id IN ({placeholders})", emprestimo_ids)
        
        # Atualizar status dos devices para "Disponível" se estavam em empréstimos ativos
        if device_ids_ativos:
            device_placeholders = ','.join(['%s'] * len(device_ids_ativos))
            cursor.execute(f"UPDATE devices SET status = 'Disponível' WHERE id IN ({device_placeholders})", device_ids_ativos)
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': f'{len(emprestimo_ids)} empréstimo(s) excluído(s) com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir empréstimos: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE ADMINISTRAÇÃO (ATUALIZADAS PARA MYSQL)
# =============================================================================

@app.route('/api/admin', methods=['GET'])
@login_required
def api_admin():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn) # Use helper
        
        # Estatísticas para admin
        cursor.execute("SELECT COUNT(*) as total FROM users")
        row = cursor.fetchone()
        total_usuarios = row['total'] if 'total' in row else list(row.values())[0] # Handle different return types
        
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'admin'")
        row = cursor.fetchone()
        admin_users = row['total'] if 'total' in row else list(row.values())[0]
        
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'user'")
        row = cursor.fetchone()
        common_users = row['total'] if 'total' in row else list(row.values())[0]
        
        # Contar tipos de devices
        cursor.execute("SELECT COUNT(*) as total FROM tipos_devices")
        row = cursor.fetchone()
        total_tipos = row['total'] if 'total' in row else list(row.values())[0]
        
        # Últimos logs de atividade (exemplo)
        cursor.execute('SELECT id, username, role FROM users ORDER BY id DESC LIMIT 5')
        recent_users = cursor.fetchall()
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'data': {
                'total_usuarios': total_usuarios,
                'admin_users': admin_users,
                'common_users': common_users,
                'total_tipos': total_tipos,
                'recent_users': recent_users
            }
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar admin: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/admin/tipos-devices', methods=['GET'])
@csrf.exempt
@login_required
def api_admin_tipos_devices():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('SELECT * FROM tipos_devices ORDER BY nome')
        tipos_data = cursor.fetchall()
        cursor.close()
        
        tipos_list = []
        for tipo in tipos_data:
            tipos_list.append({
                'id': tipo['id'],
                'nome': tipo['nome'],
                'categoria': tipo['categoria'],
                'descricao': tipo['descricao'],
                'para_emprestimo': bool(tipo['para_emprestimo']),
                'data_cadastro': tipo['data_cadastro'].isoformat() if tipo['data_cadastro'] else None
            })
        
        return jsonify({'success': True, 'data': tipos_list})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar tipos: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/admin/users', methods=['GET'])
@csrf.exempt
@login_required
def api_admin_users():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT * FROM users ORDER BY username")
        users = cursor.fetchall()
        cursor.close()
        
        # Filter sensitive data like password_hash if needed, though fetchall returns dicts
        for u in users:
            if 'password_hash' in u:
                del u['password_hash']
                
        return jsonify({'success': True, 'data': users})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar usuários: {str(e)}'}), 500
    finally:
        if conn: conn.close()
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute("SELECT * FROM users ORDER BY id")
        usuarios = cursor.fetchall()
        cursor.close()
        
        usuarios_list = []
        for user in usuarios:
            usuarios_list.append({
                'id': user['id'],
                'username': user['username'],
                'role': user['role']
            })
        
        return render_template('admin_usuarios.html', usuarios=usuarios_list)
    
    except Exception as e:
        flash(f'Erro ao carregar usuários: {str(e)}', 'error')
        return render_template('admin_usuarios.html', usuarios=[])
    finally:
        if conn:
            conn.close()

@app.route('/admin/criar-usuario', methods=['POST'])
@login_required
def criar_usuario():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')
        
        cursor = conn.cursor()
        
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                     (username, generate_password_hash(password), role))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Usuário criado com sucesso!'})
    
    except IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Nome de usuário já existe!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar usuário: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/admin/resetar-senha', methods=['POST'])
@login_required
def resetar_senha():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        nova_senha = data.get('nova_senha', '123456')  # Senha padrão
        
        cursor = conn.cursor()
        
        # Verificar se o usuário existe
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'Usuário não encontrado!'})
        
        cursor.execute("UPDATE users SET password = %s WHERE id = %s",
                     (generate_password_hash(nova_senha), user_id))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': f'Senha resetada com sucesso! Nova senha: {nova_senha}'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao resetar senha: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/admin/excluir-usuario/<int:user_id>', methods=['DELETE'])
@login_required
def excluir_usuario(user_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        # Não permitir excluir o próprio usuário
        if user_id == current_user.id:
            return jsonify({'success': False, 'message': 'Não é possível excluir seu próprio usuário!'})
        
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Usuário excluído com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir usuário: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE BACKUP (MANTIDAS COMO ESTAVAM)
# =============================================================================

@app.route('/admin/backup')
@login_required
def backup_database():
    if current_user.role != 'admin':
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('admin'))
    
    try:
        import subprocess
        
        # Criar pasta backups se não existir
        backup_dir = 'backups'
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # Nome do arquivo com timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_academy_{timestamp}.sql"
        backup_path = os.path.join(backup_dir, backup_filename)
        
        # Comando mysqldump
        db_host = os.getenv('DB_HOST', 'localhost')
        db_user = os.getenv('DB_USER', 'root')
        db_password = os.getenv('DB_PASSWORD', '')
        db_name = os.getenv('DB_NAME', 'apple_academy')
        
        cmd = [
            'mysqldump',
            '-h', db_host,
            '-u', db_user,
            f'--password={db_password}',
            db_name
        ]
        
        # Executar mysqldump e salvar no arquivo
        with open(backup_path, 'w') as f:
            result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)
        
        if result.returncode != 0:
            raise Exception(f'Erro no mysqldump: {result.stderr}')
        
        flash(f'Backup criado com sucesso: {backup_filename}', 'success')
        return redirect(url_for('admin_backups'))
    
    except Exception as e:
        flash(f'Erro ao criar backup: {str(e)}', 'error')
        return redirect(url_for('admin'))

@app.route('/admin/backups')
@login_required
def admin_backups():
    if current_user.role != 'admin':
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('dashboard'))
    
    try:
        backup_dir = 'backups'
        backups = []
        
        if os.path.exists(backup_dir):
            for file in os.listdir(backup_dir):
                if file.startswith('backup_academy_') and file.endswith('.sql'):
                    file_path = os.path.join(backup_dir, file)
                    file_time = os.path.getmtime(file_path)
                    file_size = os.path.getsize(file_path)
                    
                    # Converter tamanho para formato legível
                    if file_size < 1024:
                        tamanho_str = f"{file_size} B"
                    elif file_size < 1024 * 1024:
                        tamanho_str = f"{file_size / 1024:.1f} KB"
                    else:
                        tamanho_str = f"{file_size / (1024 * 1024):.1f} MB"
                    
                    backups.append({
                        'nome': file,
                        'caminho': file_path,
                        'tamanho': tamanho_str,
                        'tamanho_bytes': file_size,
                        'data': datetime.fromtimestamp(file_time).strftime('%d/%m/%Y %H:%M:%S'),
                        'data_timestamp': file_time
                    })
        
        # Ordenar por data (mais recente primeiro)
        backups.sort(key=lambda x: x['data_timestamp'], reverse=True)
        
        return render_template('admin_backups.html', backups=backups)
    
    except Exception as e:
        flash(f'Erro ao listar backups: {str(e)}', 'error')
        return redirect(url_for('admin'))

@app.route('/admin/backup/download/<filename>')
@login_required
def download_backup(filename):
    if current_user.role != 'admin':
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('admin'))
    
    try:
        backup_path = os.path.join('backups', filename)
        
        if os.path.exists(backup_path):
            return send_file(backup_path, as_attachment=True)
        else:
            flash('Arquivo de backup não encontrado!', 'error')
            return redirect(url_for('admin_backups'))
    
    except Exception as e:
        flash(f'Erro ao fazer download: {str(e)}', 'error')
        return redirect(url_for('admin_backups'))

@app.route('/admin/backup/delete/<filename>', methods=['DELETE'])
@login_required
def delete_backup(filename):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    try:
        backup_path = os.path.join('backups', filename)
        
        if os.path.exists(backup_path):
            os.remove(backup_path)
            return jsonify({'success': True, 'message': 'Backup excluído com sucesso!'})
        else:
            return jsonify({'success': False, 'message': 'Arquivo não encontrado!'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao excluir backup: {str(e)}'})

@app.route('/admin/backup/delete-multiple', methods=['POST'])
@login_required
def delete_multiple_backups():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    try:
        data = request.get_json()
        filenames = data.get('filenames', [])
        
        if not filenames:
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado!'})
        
        deleted_count = 0
        errors = []
        
        for filename in filenames:
            # Validar nome do arquivo para segurança
            if not filename.startswith('backup_academy_') or not filename.endswith('.sql'):
                errors.append(f"{filename}: Nome de arquivo inválido")
                continue
                
            backup_path = os.path.join('backups', secure_filename(filename))
            
            if os.path.exists(backup_path):
                try:
                    os.remove(backup_path)
                    deleted_count += 1
                except Exception as e:
                    errors.append(f"{filename}: {str(e)}")
            else:
                errors.append(f"{filename}: Arquivo não encontrado")
        
        if deleted_count > 0:
            message = f'{deleted_count} backup(s) excluído(s) com sucesso!'
            if errors:
                message += f' Erros: {", ".join(errors)}'
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': f'Nenhum backup excluído. Erros: {", ".join(errors)}'})

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao processar solicitação: {str(e)}'})

# =============================================================================
# ROTAS DE IMPORTACAO (ATUALIZADAS COM OBSERVAÇÃO - MYSQL)
# =============================================================================

@app.route('/api/importar/alunos', methods=['POST'])
@csrf.exempt
@login_required
def importar_alunos():
    try:
        criar_pasta_uploads()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Ler arquivo baseado na extensão
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, encoding='utf-8')
            else:
                df = pd.read_excel(filepath)
            
            # Mapear colunas (case insensitive)
            df.columns = [col.strip().lower() for col in df.columns]
            
            # MAPEAMENTO ATUALIZADO para as colunas do arquivo Foundation
            column_mapping = {
                'nome': ['nome', 'nome completo', 'name', 'aluno', 'student'],
                'cpf': ['cpf', 'documento', 'document'],
                'telefone': ['telefone', 'celular', 'phone', 'tel', 'contato'],
                'email': ['email', 'e-mail', 'mail'],
                'endereco': ['endereço', 'endereco', 'address', 'local', 'morada'],
                'tipo_aluno': ['tipo_aluno', 'tipo', 'type', 'categoria', 'category'],
                'tem_apple_id': ['tem_apple_id', 'apple_id', 'id_apple', 'has_apple_id'],
                'apple_id': ['apple_id', 'id_apple', 'appleid'],
                'data_inicio': ['data_inicio', 'data', 'inicio', 'start_date', 'data_início']
            }
            
            # Encontrar colunas correspondentes
            mapped_columns = {}
            for standard_col, possible_names in column_mapping.items():
                for possible in possible_names:
                    if possible in df.columns:
                        mapped_columns[standard_col] = possible
                        break
            
            # Verificar colunas obrigatórias (agora nome e email)
            required_columns = ['nome', 'email']
            missing_columns = [col for col in required_columns if col not in mapped_columns]
            
            if missing_columns:
                os.remove(filepath)
                return jsonify({
                    'success': False, 
                    'message': f'Colunas obrigatórias não encontradas: {", ".join(missing_columns)}'
                })
            
            # Processar dados
            conn = get_db_connection()
            if not conn:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
            
            cursor = conn.cursor()
            
            sucessos = 0
            erros = []
            
            for index, row in df.iterrows():
                try:
                    nome = str(row[mapped_columns['nome']]).strip()
                    email = str(row[mapped_columns['email']]).strip().lower()
                    
                    # Novos campos
                    cpf = str(row[mapped_columns['cpf']]).strip() if 'cpf' in mapped_columns else None
                    telefone = str(row[mapped_columns['telefone']]).strip() if 'telefone' in mapped_columns else None
                    endereco = str(row[mapped_columns['endereco']]).strip() if 'endereco' in mapped_columns else None
                    
                    # Campos existentes
                    tipo_aluno = str(row[mapped_columns['tipo_aluno']]).strip() if 'tipo_aluno' in mapped_columns else 'Foundation'
                    data_inicio = str(row[mapped_columns['data_inicio']]).split()[0] if 'data_inicio' in mapped_columns else datetime.now().strftime('%Y-%m-%d')
                    
                    # Processar tem_apple_id
                    if 'tem_apple_id' in mapped_columns:
                        tem_apple_id_val = row[mapped_columns['tem_apple_id']]
                        if isinstance(tem_apple_id_val, bool):
                            tem_apple_id = tem_apple_id_val
                        else:
                            tem_apple_id_str = str(tem_apple_id_val).lower().strip()
                            tem_apple_id = tem_apple_id_str in ['sim', 'yes', 'true', '1', 's', 'y']
                    else:
                        tem_apple_id = False
                    
                    # Processar apple_id
                    apple_id = None
                    if tem_apple_id and 'apple_id' in mapped_columns:
                        apple_id = str(row[mapped_columns['apple_id']]).strip()
                    
                    # Validar tipo de aluno
                    if tipo_aluno not in ['Regular', 'Foundation']:
                        tipo_aluno = 'Foundation'  # Default para Foundation
                    
                    # Inserir no banco COM NOVOS CAMPOS
                    cursor.execute('''INSERT INTO alunos 
                                    (nome, cpf, telefone, email, endereco, tem_apple_id, apple_id, tipo_aluno, data_inicio)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                 (nome, cpf, telefone, email, endereco, tem_apple_id, apple_id, tipo_aluno, data_inicio))
                    
                    sucessos += 1
                    
                except IntegrityError as e:
                    if 'email' in str(e):
                        erros.append(f"Linha {index + 2}: E-mail duplicado - {email}")
                    elif 'cpf' in str(e):
                        erros.append(f"Linha {index + 2}: CPF duplicado - {cpf}")
                    else:
                        erros.append(f"Linha {index + 2}: Dados duplicados")
                except Exception as e:
                    erros.append(f"Linha {index + 2}: {str(e)}")
            
            conn.commit()
            cursor.close()
            conn.close()
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Importação concluída! {sucessos} alunos importados com sucesso.',
                'detalhes': {
                    'sucessos': sucessos,
                    'erros': erros,
                    'total_linhas': len(df)
                }
            })
        
        else:
            return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})

@app.route('/api/importar/devices', methods=['POST'])
@csrf.exempt
@login_required
def importar_devices():
    try:
        criar_pasta_uploads()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Ler arquivo baseado na extensão
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, encoding='utf-8')
            else:
                df = pd.read_excel(filepath)
            
            # Mapear colunas (case insensitive)
            df.columns = [col.strip().lower() for col in df.columns]
            
            # Mapeamento de colunas esperadas ATUALIZADO com observacao
            column_mapping = {
                'tipo': ['tipo', 'type', 'categoria', 'category'],
                'modelo': ['modelo', 'model', 'device'],
                'numero_serie': ['numero_serie', 'serial', 'serial_number', 'n_serie'],
                'nome': ['nome', 'name', 'identificacao'],
                'cor': ['cor', 'color', 'colour'],
                'status': ['status', 'situacao', 'condition'],
                'para_emprestimo': ['para_emprestimo', 'emprestimo', 'loan', 'disponivel'],
                'observacao': ['observacao', 'observação', 'obs', 'notes', 'notas']  # Novo campo
            }
            
            # Colunas opcionais
            optional_columns = {
                'polegadas': ['polegadas', 'tamanho', 'size'],
                'ano': ['ano', 'year', 'fabricacao'],
                'chip': ['chip', 'processador', 'processor'],
                'memoria': ['memoria', 'memory', 'ram'],
                'versao_os': ['versao_os', 'os', 'sistema', 'version']
            }
            
            # Encontrar colunas correspondentes
            mapped_columns = {}
            for standard_col, possible_names in column_mapping.items():
                for possible in possible_names:
                    if possible in df.columns:
                        mapped_columns[standard_col] = possible
                        break
            
            # Verificar colunas obrigatórias
            required_columns = ['tipo', 'numero_serie']
            missing_columns = [col for col in required_columns if col not in mapped_columns]
            
            if missing_columns:
                os.remove(filepath)
                return jsonify({
                    'success': False, 
                    'message': f'Colunas obrigatórias não encontradas: {", ".join(missing_columns)}'
                })
            
            # Mapear colunas opcionais
            for standard_col, possible_names in optional_columns.items():
                for possible in possible_names:
                    if possible in df.columns:
                        mapped_columns[standard_col] = possible
                        break
            
            # Processar dados
            conn = get_db_connection()
            if not conn:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
            
            cursor = conn.cursor()
            
            sucessos = 0
            erros = []
            
            for index, row in df.iterrows():
                try:
                    tipo = str(row[mapped_columns['tipo']]).strip()
                    numero_serie = str(row[mapped_columns['numero_serie']]).strip()
                    
                    # Valores padrão
                    modelo = str(row[mapped_columns['modelo']]).strip() if 'modelo' in mapped_columns else None
                    nome = str(row[mapped_columns['nome']]).strip() if 'nome' in mapped_columns else None
                    cor = str(row[mapped_columns['cor']]).strip() if 'cor' in mapped_columns else None
                    status = str(row[mapped_columns['status']]).strip() if 'status' in mapped_columns else 'Disponível'
                    polegadas = str(row[mapped_columns['polegadas']]).strip() if 'polegadas' in mapped_columns else None
                    ano = int(row[mapped_columns['ano']]) if 'ano' in mapped_columns and pd.notna(row[mapped_columns['ano']]) else None
                    chip = str(row[mapped_columns['chip']]).strip() if 'chip' in mapped_columns else None
                    memoria = str(row[mapped_columns['memoria']]).strip() if 'memoria' in mapped_columns else None
                    versao_os = str(row[mapped_columns['versao_os']]).strip() if 'versao_os' in mapped_columns else None
                    observacao = str(row[mapped_columns['observacao']]).strip() if 'observacao' in mapped_columns else None  # Novo campo
                    
                    # Processar para_emprestimo
                    if 'para_emprestimo' in mapped_columns:
                        para_emprestimo_val = row[mapped_columns['para_emprestimo']]
                        if isinstance(para_emprestimo_val, bool):
                            para_emprestimo = para_emprestimo_val
                        else:
                            para_emprestimo_str = str(para_emprestimo_val).lower().strip()
                            para_emprestimo = para_emprestimo_str in ['sim', 'yes', 'true', '1', 's', 'y', 'disponivel']
                    else:
                        para_emprestimo = True
                    
                    # Validar status
                    if status not in ['Disponível', 'Emprestado', 'Manutenção']:
                        status = 'Disponível'
                    
                    # Validar tipo
                    tipos_validos = ['Macbook', 'Mac Mini', 'iPad', 'iPhone', 'Apple Watch', 'Vision Pro']
                    if tipo not in tipos_validos:
                        tipo = 'iPad'  # Default
                    
                    # Inserir no banco COM OBSERVAÇÃO
                    cursor.execute('''INSERT INTO devices 
                                    (tipo, modelo, cor, polegadas, ano, nome, chip, memoria, numero_serie, versao_os, status, para_emprestimo, observacao)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                                 (tipo, modelo, cor, polegadas, ano, nome, chip, memoria, numero_serie, versao_os, status, para_emprestimo, observacao))
                    
                    sucessos += 1
                    
                except IntegrityError:
                    erros.append(f"Linha {index + 2}: Número de série duplicado - {numero_serie}")
                except Exception as e:
                    erros.append(f"Linha {index + 2}: {str(e)}")
            
            conn.commit()
            cursor.close()
            conn.close()
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Importação concluída! {sucessos} devices importados com sucesso.',
                'detalhes': {
                    'sucessos': sucessos,
                    'erros': erros,
                    'total_linhas': len(df)
                }
            })
        
        else:
            return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})

# Rota para download de template ATUALIZADA
@app.route('/api/download/template/<tipo>')
@login_required
def download_template(tipo):
    try:
        if tipo == 'alunos':
            # Criar template ATUALIZADO para alunos
            template_data = {
                'nome': ['João Silva', 'Maria Santos', 'Pedro Oliveira'],
                'cpf': ['123.456.789-00', '987.654.321-00', '111.222.333-44'],
                'telefone': ['(11) 99999-9999', '(11) 88888-8888', '(11) 77777-7777'],
                'email': ['joao@email.com', 'maria@email.com', 'pedro@email.com'],
                'endereço': ['Rua A, 123 - Centro', 'Av. B, 456 - Jardim', 'Travessa C, 789 - Vila'],
                'tipo_aluno': ['Foundation', 'Foundation', 'Regular'],
                'tem_apple_id': ['Sim', 'Não', 'Sim'],
                'apple_id': ['joao@icloud.com', '', 'pedro@icloud.com'],
                'data_inicio': ['2024-01-15', '2024-02-01', '2024-01-20']
            }
            filename = 'template_importacao_alunos.xlsx'
        
        elif tipo == 'devices':
            # Criar template para devices ATUALIZADO com observacao
            template_data = {
                'tipo': ['iPad', 'Macbook', 'iPhone'],
                'modelo': ['iPad Pro', 'MacBook Air', 'iPhone 15'],
                'numero_serie': ['ABC123', 'DEF456', 'GHI789'],
                'nome': ['iPad Sala A', 'MacBook Professor', 'iPhone Teste'],
                'cor': ['Cinza', 'Prata', 'Preto'],
                'status': ['Disponível', 'Disponível', 'Disponível'],
                'para_emprestimo': ['Sim', 'Sim', 'Sim'],
                'polegadas': ['11', '13', '6.1'],
                'ano': [2023, 2022, 2023],
                'chip': ['M1', 'M2', 'A16'],
                'memoria': ['8GB', '16GB', '6GB'],
                'versao_os': ['iPadOS 17', 'macOS 14', 'iOS 17'],
                'observacao': ['Device em perfeito estado', 'Teclado US', 'Bateria com 98% de saúde']  # Novo campo
            }
            filename = 'template_importacao_devices.xlsx'
        
        elif tipo == 'inventory':
            template_data = {
                'tombamento': ['INV-001', 'INV-002', 'INV-003'],
                'equipamento': ['Armário A', 'Apple TV Sala B', 'Mesa Makerspace'],
                'carga': ['50kg', 'Light', 'Pesado'],
                'local': ['Sala 101', 'Laboratório 2', 'Makerspace'],
                'etiquetado': ['Sim', 'Não', 'Sim']
            }
            filename = 'template_importacao_inventory.xlsx'
        
        else:
            return jsonify({'success': False, 'message': 'Template não encontrado'})
        
        # Criar DataFrame e salvar como Excel
        df = pd.DataFrame(template_data)
        
        # Salvar em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Template', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao gerar template: {str(e)}'})

@app.route('/api/export/<entity>')
@login_required
def export_data(entity):
    entity_key = entity.lower()
    exports = {
        'devices': {
            'query': '''SELECT tipo AS Tipo, modelo AS Modelo, cor AS Cor, polegadas AS Polegadas,
                        ano AS Ano, nome AS Nome, chip AS Chip, memoria AS Memoria, 
                        numero_serie AS NumeroSerie, versao_os AS VersaoOS, status AS Status, 
                        para_emprestimo AS ParaEmprestimo, observacao AS Observacao
                        FROM devices WHERE para_emprestimo = 1 ORDER BY tipo, nome''',
            'filename': 'devices_export',
            'requires_admin': False,
            'bool_columns': ['ParaEmprestimo']
        },
        'equipment-control': {
            'query': '''SELECT tipo_device AS TipoDevice, numero_serie AS NumeroSerie, modelo AS Modelo,
                        cor AS Cor, status AS Status, para_emprestimo AS ParaEmprestimo, responsavel AS Responsavel,
                        local AS Local, convenio AS Convenio, observacao AS Observacao, data_cadastro AS DataCadastro
                        FROM equipment_control ORDER BY data_cadastro DESC''',
            'filename': 'equipment_control_export',
            'requires_admin': True,
            'bool_columns': ['ParaEmprestimo']
        },
        'inventory': {
            'query': '''SELECT tombamento AS Tombamento, equipamento AS Equipamento, carga AS Carga,
                        local AS Local, etiquetado AS Etiquetado, data_cadastro AS DataCadastro
                        FROM inventory ORDER BY data_cadastro DESC''',
            'filename': 'inventory_export',
            'requires_admin': True,
            'bool_columns': ['Etiquetado']
        }
    }
    
    config = exports.get(entity_key)
    if not config:
        return jsonify({'success': False, 'message': 'Fonte de dados não encontrada!'}), 404
    
    if config['requires_admin'] and current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute(config['query'])
        rows = cursor.fetchall()
        cursor.close()
        
        df = pd.DataFrame(rows)
        for col in config.get('bool_columns', []):
            if col in df.columns:
                df[col] = df[col].apply(lambda val: 'Sim' if bool(val) else 'Não')
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Dados', index=False)
        
        output.seek(0)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{config['filename']}_{timestamp}.xlsx"
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao exportar dados: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# =============================================================================
# API ENDPOINTS PARA DADOS (ATUALIZADOS PARA MYSQL)
# =============================================================================

@app.route('/api/dashboard/stats')
@login_required
def api_dashboard_stats():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        cursor = get_db_cursor(conn)
        
        # Estatísticas de alunos
        cursor.execute("SELECT COUNT(*) as total FROM alunos")
        total_alunos = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Regular'")
        alunos_regular = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation'")
        alunos_foundation = cursor.fetchone()['total']
        
        # Foundation por trimestre atual (últimos 3 meses)
        tres_meses_atras = datetime.now() - timedelta(days=90)
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND data_inicio >= %s", (tres_meses_atras.date(),))
        foundation_trimestre = cursor.fetchone()['total']
        
        # Foundation por ano atual
        ano_atual = datetime.now().year
        cursor.execute("SELECT COUNT(*) as total FROM alunos WHERE tipo_aluno = 'Foundation' AND EXTRACT(YEAR FROM data_inicio) = %s", (ano_atual,))
        foundation_ano = cursor.fetchone()['total']
        
        # Estatísticas de devices - CORRIGIDAS PARA INCLUIR EQUIPMENT_CONTROL
        # Para Empréstimo: devices com para_emprestimo=1 + equipments com status='Emprestado' e para_emprestimo=1 (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE para_emprestimo = 1) +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = 1 AND d.id IS NULL)
            as total
        ''')
        devices_emprestimo = cursor.fetchone()['total']
        
        # Emprestados: devices com status='Emprestado' + equipments com status='Emprestado' e para_emprestimo=1 (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE status = 'Emprestado') +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Emprestado' AND ec.para_emprestimo = 1 AND d.id IS NULL)
            as total
        ''')
        devices_emprestados = cursor.fetchone()['total']
        
        # Disponíveis: apenas devices com status='Disponível' e para_emprestimo=1
        cursor.execute("SELECT COUNT(*) as total FROM devices WHERE status = 'Disponível' AND para_emprestimo = 1")
        devices_disponiveis = cursor.fetchone()['total']
        
        # Devices em Manutenção: devices + equipments com status='Manutenção' (que não estão em devices)
        cursor.execute('''
            SELECT 
                (SELECT COUNT(*) FROM devices WHERE status = 'Manutenção') +
                (SELECT COUNT(*) FROM equipment_control ec
                 LEFT JOIN devices d ON ec.numero_serie = d.numero_serie
                 WHERE ec.status = 'Manutenção' AND d.id IS NULL)
            as total
        ''')
        devices_manutencao = cursor.fetchone()['total']
        
        # Empréstimos Recentes
        cursor.execute('''SELECT e.data_retirada, a.nome as aluno_nome, d.nome as device_nome, d.tipo as device_tipo 
                         FROM emprestimos e
                         JOIN alunos a ON e.aluno_id = a.id
                         JOIN devices d ON e.device_id = d.id
                         WHERE e.status = 'Ativo'
                         ORDER BY e.data_retirada DESC LIMIT 5''')
        emprestimos_recentes = cursor.fetchall()
        
        # Devices Mais Utilizados
        cursor.execute('''SELECT d.nome, d.tipo, COUNT(e.id) as total_emprestimos
                         FROM devices d
                         LEFT JOIN emprestimos e ON d.id = e.device_id
                         GROUP BY d.id, d.nome, d.tipo
                         ORDER BY total_emprestimos DESC, d.nome
                         LIMIT 5''')
        devices_mais_utilizados = cursor.fetchall()
        
        cursor.close()
        
        # Converter datas para string (formato brasileiro)
        for emp in emprestimos_recentes:
            if emp['data_retirada']:
                if isinstance(emp['data_retirada'], datetime):
                    emp['data_retirada'] = emp['data_retirada'].strftime('%d/%m/%Y')
                elif hasattr(emp['data_retirada'], 'strftime'):
                    emp['data_retirada'] = emp['data_retirada'].strftime('%d/%m/%Y')
                else:
                    # Se for string ou outro formato
                    try:
                        date_obj = datetime.strptime(str(emp['data_retirada']), '%Y-%m-%d')
                        emp['data_retirada'] = date_obj.strftime('%d/%m/%Y')
                    except:
                        emp['data_retirada'] = str(emp['data_retirada'])
        
        return jsonify({
            'success': True,
            'total_alunos': total_alunos,
            'alunos_regular': alunos_regular,
            'alunos_foundation': alunos_foundation,
            'foundation_trimestre': foundation_trimestre,
            'foundation_ano': foundation_ano,
            'devices_emprestimo': devices_emprestimo,
            'devices_emprestados': devices_emprestados,
            'devices_disponiveis': devices_disponiveis,
            'devices_manutencao': devices_manutencao,
            'emprestimos_recentes': emprestimos_recentes,
            'devices_mais_utilizados': devices_mais_utilizados
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao carregar estatísticas: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# API PARA TIPOS DE DEVICES (NOVAS ROTAS - MYSQL)
# =============================================================================

@app.route('/api/tipos-devices', methods=['GET', 'POST'])
@csrf.exempt
@login_required
def api_tipos_devices():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        if request.method == 'GET':
            # Listar todos os tipos
            cursor = get_db_cursor(conn)
            cursor.execute('''SELECT * FROM tipos_devices ORDER BY nome''')
            tipos_data = cursor.fetchall()
            cursor.close()
            
            tipos_list = []
            for tipo in tipos_data:
                tipos_list.append({
                    'id': tipo['id'],
                    'nome': tipo['nome'],
                    'categoria': tipo['categoria'],
                    'descricao': tipo['descricao'],
                    'para_emprestimo': bool(tipo['para_emprestimo']),
                    'data_cadastro': tipo['data_cadastro']
                })
            
            return jsonify({'success': True, 'data': tipos_list})
        
        elif request.method == 'POST':
            # Criar novo tipo
            data = request.get_json()
            
            nome = data.get('nome')
            categoria = data.get('categoria')
            descricao = data.get('descricao')
            para_emprestimo = data.get('para_emprestimo', True)
            
            if not nome or not categoria:
                return jsonify({'success': False, 'message': 'Nome e categoria são obrigatórios!'})
            
            cursor = conn.cursor()
            
            cursor.execute('''INSERT INTO tipos_devices (nome, categoria, descricao, para_emprestimo)
                             VALUES (%s, %s, %s, %s)''',
                         (nome, categoria, descricao, para_emprestimo))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Tipo de device cadastrado com sucesso!'})
    
    except IntegrityError:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Nome do tipo já existe!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar tipos: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/tipos-devices/<int:tipo_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def api_tipo_device(tipo_id):
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        if request.method == 'GET':
            # Buscar tipo específico
            cursor = get_db_cursor(conn)
            cursor.execute("SELECT * FROM tipos_devices WHERE id = %s", (tipo_id,))
            tipo = cursor.fetchone()
            cursor.close()
            
            if tipo:
                tipo_data = {
                    'id': tipo['id'],
                    'nome': tipo['nome'],
                    'categoria': tipo['categoria'],
                    'descricao': tipo['descricao'],
                    'para_emprestimo': bool(tipo['para_emprestimo']),
                    'data_cadastro': tipo['data_cadastro']
                }
                return jsonify({'success': True, 'data': tipo_data})
            else:
                return jsonify({'success': False, 'message': 'Tipo de device não encontrado!'})
        
        elif request.method == 'PUT':
            # Atualizar tipo
            data = request.get_json()
            
            nome = data.get('nome')
            categoria = data.get('categoria')
            descricao = data.get('descricao')
            para_emprestimo = data.get('para_emprestimo', True)
            
            if not nome or not categoria:
                return jsonify({'success': False, 'message': 'Nome e categoria são obrigatórios!'})
            
            cursor = conn.cursor()
            
            # Verificar se nome já existe (excluindo o próprio tipo)
            cursor.execute("SELECT id FROM tipos_devices WHERE nome = %s AND id != %s", (nome, tipo_id))
            existing = cursor.fetchone()
            if existing:
                return jsonify({'success': False, 'message': 'Nome do tipo já existe!'})
            
            cursor.execute('''UPDATE tipos_devices SET 
                            nome = %s, categoria = %s, descricao = %s, para_emprestimo = %s
                            WHERE id = %s''',
                         (nome, categoria, descricao, para_emprestimo, tipo_id))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Tipo de device atualizado com sucesso!'})
        
        elif request.method == 'DELETE':
            # Excluir tipo
            cursor = conn.cursor()
            
            # Verificar se o tipo está sendo usado em devices
            cursor.execute("SELECT COUNT(*) FROM devices WHERE tipo = (SELECT nome FROM tipos_devices WHERE id = %s)", (tipo_id,))
            count_devices = cursor.fetchone()[0]
            
            if count_devices > 0:
                return jsonify({'success': False, 'message': f'Não é possível excluir. Este tipo está sendo usado por {count_devices} device(s)!'})
            
            cursor.execute("DELETE FROM tipos_devices WHERE id = %s", (tipo_id,))
            
            conn.commit()
            cursor.close()
            
            return jsonify({'success': True, 'message': 'Tipo de device excluído com sucesso!'})
    
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao processar tipo: {str(e)}'})
    finally:
        if conn:
            conn.close()

@app.route('/api/tipos-devices/lista')
@login_required
def api_tipos_devices_lista():
    """Endpoint simplificado para selects"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('''SELECT id, nome, categoria FROM tipos_devices 
                         WHERE para_emprestimo = TRUE 
                         ORDER BY nome''')
        tipos_data = cursor.fetchall()
        cursor.close()
        
        tipos_list = []
        for tipo in tipos_data:
            tipos_list.append({
                'id': tipo['id'],
                'nome': tipo['nome'],
                'categoria': tipo['categoria']
            })
        
        return jsonify({'success': True, 'data': tipos_list})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar tipos: {str(e)}'})
    finally:
        if conn:
            conn.close()

# =============================================================================
# ROTAS DE IMPORTACAO PARA TIPOS DE DEVICES (MYSQL)
# =============================================================================

@app.route('/api/importar/tipos-devices', methods=['POST'])
@login_required
def importar_tipos_devices():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'})
    
    try:
        criar_pasta_uploads()
        
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'})
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'})
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Ler arquivo baseado na extensão
            if filename.endswith('.csv'):
                df = pd.read_csv(filepath, encoding='utf-8')
            else:
                df = pd.read_excel(filepath)
            
            # Mapear colunas (case insensitive)
            df.columns = [col.strip().lower() for col in df.columns]
            
            # Mapeamento de colunas esperadas
            column_mapping = {
                'nome': ['nome', 'name', 'tipo', 'type'],
                'categoria': ['categoria', 'category', 'classe'],
                'descricao': ['descricao', 'descrição', 'description', 'obs'],
                'para_emprestimo': ['para_emprestimo', 'emprestimo', 'loan', 'disponivel']
            }
            
            # Encontrar colunas correspondentes
            mapped_columns = {}
            for standard_col, possible_names in column_mapping.items():
                for possible in possible_names:
                    if possible in df.columns:
                        mapped_columns[standard_col] = possible
                        break
            
            # Verificar colunas obrigatórias
            required_columns = ['nome']
            missing_columns = [col for col in required_columns if col not in mapped_columns]
            
            if missing_columns:
                os.remove(filepath)
                return jsonify({
                    'success': False, 
                    'message': f'Colunas obrigatórias não encontradas: {", ".join(missing_columns)}'
                })
            
            # Processar dados
            conn = get_db_connection()
            if not conn:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'})
            
            cursor = conn.cursor()
            
            sucessos = 0
            erros = []
            
            for index, row in df.iterrows():
                try:
                    nome = str(row[mapped_columns['nome']]).strip()
                    
                    # Valores padrão
                    categoria = str(row[mapped_columns['categoria']]).strip() if 'categoria' in mapped_columns else 'Outros'
                    descricao = str(row[mapped_columns['descricao']]).strip() if 'descricao' in mapped_columns else None
                    
                    # Processar para_emprestimo
                    if 'para_emprestimo' in mapped_columns:
                        para_emprestimo_val = row[mapped_columns['para_emprestimo']]
                        if isinstance(para_emprestimo_val, bool):
                            para_emprestimo = para_emprestimo_val
                        else:
                            para_emprestimo_str = str(para_emprestimo_val).lower().strip()
                            para_emprestimo = para_emprestimo_str in ['sim', 'yes', 'true', '1', 's', 'y', 'disponivel']
                    else:
                        para_emprestimo = True
                    
                    # Validar categoria
                    categorias_validas = ['Smartphone', 'Tablet', 'Notebook', 'Desktop', 'Wearable', 'VR/AR', 'Acessório', 'Áudio', 'Outros']
                    if categoria not in categorias_validas:
                        categoria = 'Outros'
                    
                    # Inserir no banco
                    cursor.execute('''INSERT INTO tipos_devices (nome, categoria, descricao, para_emprestimo)
                                    VALUES (%s, %s, %s, %s)''',
                                 (nome, categoria, descricao, para_emprestimo))
                    
                    sucessos += 1
                    
                except IntegrityError:
                    erros.append(f"Linha {index + 2}: Nome duplicado - {nome}")
                except Exception as e:
                    erros.append(f"Linha {index + 2}: {str(e)}")
            
            conn.commit()
            cursor.close()
            conn.close()
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Importação concluída! {sucessos} tipos importados com sucesso.',
                'detalhes': {
                    'sucessos': sucessos,
                    'erros': erros,
                    'total_linhas': len(df)
                }
            })
        
        else:
            return jsonify({'success': False, 'message': 'Tipo de arquivo não permitido'})
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro na importação: {str(e)}'})

@app.route('/download/template-tipos-devices')
@login_required
def download_template_tipos_devices():
    if current_user.role != 'admin':
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('admin_tipos_devices'))
    
    try:
        # Criar template para tipos de devices
        template_data = {
            'nome': ['iPhone 15 Pro', 'iPad Pro 12.9', 'MacBook Pro M3', 'Apple Watch Series 9'],
            'categoria': ['Smartphone', 'Tablet', 'Notebook', 'Wearable'],
            'descricao': ['Smartphone flagship Apple', 'Tablet profissional Apple', 'Notebook profissional Apple', 'Relógio inteligente Apple'],
            'para_emprestimo': ['Sim', 'Sim', 'Sim', 'Sim']
        }
        
        filename = 'template_importacao_tipos_devices.xlsx'
        
        # Criar DataFrame e salvar como Excel
        df = pd.DataFrame(template_data)
        
        # Salvar em memória
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Template', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao gerar template: {str(e)}'})

# =============================================================================
# MÓDULO DE BIBLIOTECA - CIRCULAÇÃO E EMPRÉSTIMOS
# =============================================================================

@app.route('/emprestimos-livros')
@login_required
def emprestimos_livros_page():
    if current_user.role not in ['admin', 'professor', 'user']:
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('dashboard'))
    
    conn = get_db_connection()
    if not conn: return render_template('dashboard.html')
    
    try:
        cursor = get_db_cursor(conn)
        
        # Atualizar status de empréstimos atrasados
        cursor.execute("UPDATE emprestimos_livros SET status = 'Atrasado' WHERE status = 'Ativo' AND data_previsao_devolucao < CURDATE()")
        conn.commit()
        
        # Carregar empréstimos ativos
        cursor.execute('''
            SELECT el.*, l.titulo, l.autor, e.codigo_barras, a.nome as aluno_nome, el.criado_por
            FROM emprestimos_livros el
            JOIN exemplares e ON el.exemplar_id = e.id
            JOIN livros l ON e.livro_id = l.id
            JOIN alunos a ON el.aluno_id = a.id
            WHERE el.status = 'Ativo' OR el.status = 'Atrasado'
            ORDER BY el.data_retirada DESC
        ''')
        emprestimos = cursor.fetchall()
        
        # Carregar todos alunos para o select
        cursor.execute("SELECT id, nome, tipo_aluno FROM alunos ORDER BY nome")
        alunos = cursor.fetchall()
        
        cursor.close()
        return render_template('emprestimos_livros.html', emprestimos=emprestimos, alunos=alunos)
    finally:
        if conn: conn.close()

@app.route('/api/emprestimos-livros/lista', methods=['GET'])
@login_required
def api_listar_emprestimos_livros():
    """API JSON para listar empréstimos de livros"""
    conn = get_db_connection()
    if not conn: return jsonify({'success': False}), 500
    
    try:
        cursor = get_db_cursor(conn)
        
        # Atualizar status de empréstimos atrasados
        cursor.execute("UPDATE emprestimos_livros SET status = 'Atrasado' WHERE status = 'Ativo' AND data_previsao_devolucao < CURRENT_DATE")
        conn.commit()
        
        # Carregar empréstimos ativos e atrasados
        cursor.execute('''
            SELECT el.id, el.aluno_id, el.exemplar_id, el.data_retirada, el.data_previsao_devolucao, el.status,
                   l.titulo, l.autor, e.codigo_barras, a.nome as aluno_nome
            FROM emprestimos_livros el
            JOIN exemplares e ON el.exemplar_id = e.id
            JOIN livros l ON e.livro_id = l.id
            JOIN alunos a ON el.aluno_id = a.id
            WHERE el.status IN ('Ativo', 'Atrasado')
            ORDER BY el.data_retirada DESC
        ''')
        emprestimos = cursor.fetchall()
        
        # Convert List of RealDictRow to list of dicts and format dates
        emprestimos_list = []
        for emp in emprestimos:
            emprestimos_list.append({
                'id': emp['id'],
                'aluno_id': emp['aluno_id'],
                'exemplar_id': emp['exemplar_id'],
                'data_retirada': emp['data_retirada'].isoformat() if emp['data_retirada'] else None,
                'data_previsao_devolucao': emp['data_previsao_devolucao'].isoformat() if emp['data_previsao_devolucao'] else None,
                'status': emp['status'],
                'titulo': emp['titulo'],
                'autor': emp['autor'],
                'codigo_barras': emp['codigo_barras'],
                'aluno_nome': emp['aluno_nome']
            })
            
        return jsonify({'success': True, 'data': emprestimos_list})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/emprestimos-livros', methods=['POST'])
@csrf.exempt
@login_required
def criar_emprestimo_livro():
    if current_user.role not in ['admin', 'professor', 'user']: return jsonify({'success': False}), 403
    
    conn = get_db_connection()
    if not conn: return jsonify({'success': False}), 500
    
    try:
            data = request.json
            print(f"DEBUG: criando emprestimo livro - data keys: {list(data.keys()) if data else 'None'}")
            aluno_id = data.get('aluno_id')
            codigo_barras = data.get('codigo_barras', '').strip()
            data_retirada_str = data.get('data_retirada') # Nova data customizada
            
            if not aluno_id or not codigo_barras:
                return jsonify({'success': False, 'message': 'Dados incompletos!'})

            # Validar e processar data de retirada
            try:
                if data_retirada_str:
                    data_retirada = datetime.strptime(data_retirada_str, '%Y-%m-%d').date()
                else:
                    data_retirada = date.today()
            except ValueError:
                return jsonify({'success': False, 'message': 'Data inválida!'})

            data_previsao = data_retirada + timedelta(days=14)
            
            # Buscar exemplar
            cursor = get_db_cursor(conn) # Moved cursor creation here
            cursor.execute("SELECT id, status, livro_id FROM exemplares WHERE codigo_barras = %s", (codigo_barras,))
            exemplar = cursor.fetchone()
            
            if not exemplar:
                return jsonify({'success': False, 'message': 'Exemplar não encontrado!'})
            
            if exemplar['status'] != 'Disponível':
                return jsonify({'success': False, 'message': f"Exemplar indisponível (Status: {exemplar['status']})"})

            # Registrar empréstimo (Atualizado com criado_por, assinatura e data customizada)
            cursor.execute('''
                INSERT INTO emprestimos_livros (aluno_id, exemplar_id, data_retirada, data_previsao_devolucao, status, criado_por, assinatura)
                VALUES (%s, %s, %s, %s, 'Ativo', %s, %s)
            ''', (aluno_id, exemplar['id'], data_retirada, data_previsao, current_user.id, data.get('assinatura')))
            
            # Atualizar status do exemplar
            cursor.execute("UPDATE exemplares SET status = 'Emprestado' WHERE id = %s", (exemplar['id'],))
            
            conn.commit()
            return jsonify({'success': True, 'message': 'Empréstimo realizado com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/devolucao-livros', methods=['POST'])
@csrf.exempt
@login_required
def devolver_livro():
    if current_user.role not in ['admin', 'professor', 'user']: return jsonify({'success': False}), 403
    
    conn = get_db_connection()
    try:
        data = request.get_json()
        emprestimo_id = data.get('emprestimo_id')
        codigo_barras = data.get('codigo_barras') # Opção de devolver por leitura de código também
        
        cursor = get_db_cursor(conn)
        
        if codigo_barras and not emprestimo_id:
            # Buscar empréstimo ativo pelo código de barras
            cursor.execute('''
                SELECT el.id, el.exemplar_id 
                FROM emprestimos_livros el
                JOIN exemplares e ON el.exemplar_id = e.id
                WHERE e.codigo_barras = %s AND el.status = 'Ativo'
            ''', (codigo_barras,))
            result = cursor.fetchone()
            if result:
                emprestimo_id = result['id']
            else:
                return jsonify({'success': False, 'message': 'Nenhum empréstimo ativo encontrado para este item.'}), 404
        
        # Processar devolução
        cursor.execute('SELECT exemplar_id FROM emprestimos_livros WHERE id = %s', (emprestimo_id,))
        emp = cursor.fetchone()
        if not emp: return jsonify({'success': False}), 404
        
        cursor.execute('''
            UPDATE emprestimos_livros 
            SET status = 'Finalizado', data_devolucao_real = NOW() 
            WHERE id = %s
        ''', (emprestimo_id,))
        
        cursor.execute('UPDATE exemplares SET status = "Disponível" WHERE id = %s', (emp['exemplar_id'],))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Devolução realizada!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn: conn.close()

# =============================================================================
# ROTAS DE AGENDA
# =============================================================================

@app.route('/agenda')
@login_required
def agenda():
    """Página principal da agenda"""
    return render_template('agenda.html')

@app.route('/api/eventos', methods=['GET'])
@login_required
def listar_eventos():
    """Listar todos os eventos"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        
        # Filtros opcionais
        data_inicio = request.args.get('start')
        data_fim = request.args.get('end')
        
        if data_inicio and data_fim:
            cursor.execute('''
                SELECT e.*, u.username as criado_por_nome
                FROM eventos e
                LEFT JOIN users u ON e.criado_por = u.id
                WHERE e.data_inicio >= %s AND e.data_fim <= %s
                ORDER BY e.data_inicio ASC
            ''', (data_inicio, data_fim))
        else:
            cursor.execute('''
                SELECT e.*, u.username as criado_por_nome
                FROM eventos e
                LEFT JOIN users u ON e.criado_por = u.id
                ORDER BY e.data_inicio ASC
            ''')
        
        eventos = cursor.fetchall()
        cursor.close()
        
        # Formatar datas para ISO format (compatível com FullCalendar)
        for evento in eventos:
            if evento['data_inicio']:
                evento['data_inicio'] = evento['data_inicio'].isoformat()
            if evento['data_fim']:
                evento['data_fim'] = evento['data_fim'].isoformat()
            if evento['data_criacao']:
                evento['data_criacao'] = evento['data_criacao'].isoformat()
            evento['sincronizado'] = bool(evento['sincronizado'])
        
        return jsonify({
            'success': True,
            'data': eventos
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao listar eventos: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/eventos', methods=['POST'])
@csrf.exempt
@login_required
def criar_evento():
    """Criar novo evento"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados JSON inválidos'}), 400
        
        # Validar campos obrigatórios
        if not data.get('titulo') or not data.get('data_inicio') or not data.get('data_fim'):
            return jsonify({'success': False, 'message': 'Título, data de início e data de fim são obrigatórios!'}), 400
        
        cursor = get_db_cursor(conn)
        query = '''
            INSERT INTO eventos 
            (titulo, descricao, data_inicio, data_fim, local, cor, tipo, participantes, criado_por)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        '''
        
        if os.getenv('DB_TYPE') == 'postgres':
            query += ' RETURNING id'
            
        cursor.execute(query, (
            data.get('titulo'),
            data.get('descricao', ''),
            data.get('data_inicio'),
            data.get('data_fim'),
            data.get('local', ''),
            data.get('cor', '#007bff'),
            data.get('tipo', ''),
            data.get('participantes', ''),
            current_user.id
        ))
        
        if os.getenv('DB_TYPE') == 'postgres':
             evento_id = cursor.fetchone()['id']
             conn.commit()
        else:
             conn.commit()
             evento_id = cursor.lastrowid
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': 'Evento criado com sucesso!',
            'id': evento_id
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar evento: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/eventos/<int:evento_id>', methods=['GET'])
@login_required
def buscar_evento(evento_id):
    """Buscar evento específico"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('''
            SELECT e.*, u.username as criado_por_nome
            FROM eventos e
            LEFT JOIN users u ON e.criado_por = u.id
            WHERE e.id = %s
        ''', (evento_id,))
        evento = cursor.fetchone()
        cursor.close()
        
        if not evento:
            return jsonify({'success': False, 'message': 'Evento não encontrado'}), 404
        
        # Formatar datas
        if evento['data_inicio']:
            evento['data_inicio'] = evento['data_inicio'].isoformat()
        if evento['data_fim']:
            evento['data_fim'] = evento['data_fim'].isoformat()
        if evento['data_criacao']:
            evento['data_criacao'] = evento['data_criacao'].isoformat()
        evento['sincronizado'] = bool(evento['sincronizado'])
        
        return jsonify({
            'success': True,
            'data': evento
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao buscar evento: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/eventos/<int:evento_id>', methods=['PUT'])
@csrf.exempt
@login_required
def atualizar_evento(evento_id):
    """Atualizar evento"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados JSON inválidos'}), 400
        
        cursor = get_db_cursor(conn)
        cursor.execute('''
            UPDATE eventos SET 
            titulo = %s, descricao = %s, data_inicio = %s, data_fim = %s,
            local = %s, cor = %s, tipo = %s, participantes = %s
            WHERE id = %s
        ''', (
            data.get('titulo'),
            data.get('descricao', ''),
            data.get('data_inicio'),
            data.get('data_fim'),
            data.get('local', ''),
            data.get('cor', '#007bff'),
            data.get('tipo', ''),
            data.get('participantes', ''),
            evento_id
        ))
        
        conn.commit()
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': 'Evento atualizado com sucesso!'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar evento: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/eventos/<int:evento_id>', methods=['DELETE'])
@csrf.exempt
@login_required
def excluir_evento(evento_id):
    """Excluir evento"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute('DELETE FROM eventos WHERE id = %s', (evento_id,))
        conn.commit()
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': 'Evento excluído com sucesso!'
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir evento: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/eventos/dashboard', methods=['GET'])
@login_required
def eventos_dashboard():
    """Listar próximos 5 eventos para o dashboard"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        
        # Buscar próximos eventos (a partir de agora)
        cursor.execute('''
            SELECT e.*, u.username as criado_por_nome
            FROM eventos e
            LEFT JOIN users u ON e.criado_por = u.id
            WHERE e.data_inicio >= NOW()
            ORDER BY e.data_inicio ASC
            LIMIT 5
        ''')
        
        eventos = cursor.fetchall()
        cursor.close()
        
        # Formatar datas
        for evento in eventos:
            if evento['data_inicio']:
                evento['data_inicio'] = evento['data_inicio'].isoformat()
            if evento['data_fim']:
                evento['data_fim'] = evento['data_fim'].isoformat()
            if evento['data_criacao']:
                evento['data_criacao'] = evento['data_criacao'].isoformat()
            evento['sincronizado'] = bool(evento['sincronizado'])
        
        return jsonify({
            'success': True,
            'data': eventos
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao listar eventos: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

# =============================================================================
# MÓDULO DE BIBLIOTECA - GERENCIAMENTO DE LIVROS
# =============================================================================

@app.route('/livros')
@login_required
def livros_catalogo():
    """Catálogo de livros público/estudantes"""
    conn = get_db_connection()
    if not conn:
        flash('Erro de conexão com o banco!', 'error')
        return render_template('dashboard.html')
    
    try:
        cursor = get_db_cursor(conn)
        # Busca livros com contagem de exemplares disponíveis
        cursor.execute('''
            SELECT l.*, 
                   COUNT(e.id) as total_exemplares,
                   SUM(CASE WHEN e.status = 'Disponível' THEN 1 ELSE 0 END) as disponiveis
            FROM livros l
            LEFT JOIN exemplares e ON l.id = e.livro_id
            GROUP BY l.id
            ORDER BY l.titulo ASC
        ''')
        livros = cursor.fetchall()
        cursor.close()
        return render_template('livros_catalogo.html', livros=livros)
    except Exception as e:
        flash(f'Erro ao carregar catálogo: {str(e)}', 'error')
        return redirect(url_for('dashboard'))
    finally:
        if conn:
            conn.close()

@app.route('/admin/livros')
@login_required
def livros_gerenciamento():
    """Gerenciamento de livros (Admin/Bibliotecário)"""
    if current_user.role != 'admin': # Considerar role 'bibliotecario' no futuro
        flash('Acesso não autorizado!', 'error')
        return redirect(url_for('dashboard'))
        
    return render_template('livros_gerenciamento.html')

@app.route('/api/enviar-alerta-atraso', methods=['POST'])
@csrf.exempt
@login_required
def enviar_alerta_atraso():
    if not current_user.email:
        return jsonify({'success': False, 'message': 'Seu perfil não possui e-mail cadastrado.'})
    
    conn = get_db_connection()
    if not conn: 
        return jsonify({'success': False, 'message': 'Erro de conexão com banco de dados.'})
    
    try:
        cursor = get_db_cursor(conn)
        # Buscar empréstimos atrasados do professor logado
        cursor.execute('''
            SELECT el.*, l.titulo, a.nome as aluno_nome, el.data_previsao_devolucao
            FROM emprestimos_livros el
            JOIN exemplares e ON el.exemplar_id = e.id
            JOIN livros l ON e.livro_id = l.id
            JOIN alunos a ON el.aluno_id = a.id
            WHERE el.status = 'Atrasado' AND el.criado_por = %s
        ''', (current_user.id,))
        atrasos = cursor.fetchall()
        
        if not atrasos:
            return jsonify({'success': False, 'message': 'Não há empréstimos atrasados para reportar.'})
            
        # Construir corpo do e-mail
        html_body = f"<h2>Relatório de Atrasos - {current_user.username}</h2>"
        html_body += "<p>Os seguintes livros sob sua responsabilidade estão atrasados:</p><ul>"
        
        for item in atrasos:
            data_prev = item['data_previsao_devolucao'].strftime('%d/%m/%Y') if item['data_previsao_devolucao'] else 'N/A'
            html_body += f"<li><strong>Aluno:</strong> {item['aluno_nome']} | <strong>Livro:</strong> {item['titulo']} | <strong>Vencimento:</strong> {data_prev}</li>"
            
        html_body += "</ul><br><p>Sistema Apple Academy Manager</p>"
        
        msg = Message("Alerta de Livros Atrasados", recipients=[current_user.email])
        msg.html = html_body
        
        mail.send(msg)
        
        return jsonify({'success': True, 'message': f'Relatório enviado para {current_user.email}!'})
        
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return jsonify({'success': False, 'message': f'Erro ao enviar e-mail. Verifique as configurações.'})
    finally:
        if conn: conn.close()

@app.route('/api/livros', methods=['GET', 'POST', 'PUT', 'DELETE'])
@csrf.exempt
@login_required
def api_livros():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão'}), 500

    try:
        cursor = get_db_cursor(conn)

        if request.method == 'GET':
            cursor.execute('''
                SELECT l.*, 
                       COUNT(e.id) as total_exemplares,
                       SUM(CASE WHEN e.status = 'Disponível' THEN 1 ELSE 0 END) as disponiveis
                FROM livros l
                LEFT JOIN exemplares e ON l.id = e.livro_id
                GROUP BY l.id
                ORDER BY l.id DESC
            ''')
            livros = cursor.fetchall()
            return jsonify({'success': True, 'data': livros})

        elif request.method == 'POST':
            if current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'Não autorizado'}), 403
            
            data = request.form # Form data para suportar upload de imagem no futuro
            titulo = data.get('titulo')
            autor = data.get('autor')
            isbn = data.get('isbn')
            categoria = data.get('categoria')
            
            if not titulo or not autor:
                return jsonify({'success': False, 'message': 'Título e Autor são obrigatórios'}), 400
                
            cursor.execute('''
                INSERT INTO livros (titulo, autor, isbn, categoria, ano, editora, edicao, descricao)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ''', (titulo, autor, isbn, categoria, data.get('ano'), data.get('editora'), data.get('edicao'), data.get('descricao')))
            conn.commit()
            return jsonify({'success': True, 'message': 'Livro cadastrado com sucesso!'})

        elif request.method == 'PUT':
            if current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'Não autorizado'}), 403
            
            data = request.form
            livro_id = data.get('id')
            titulo = data.get('titulo')
            autor = data.get('autor')
            
            if not livro_id:
                return jsonify({'success': False, 'message': 'ID do livro é obrigatório'}), 400
            if not titulo or not autor:
                return jsonify({'success': False, 'message': 'Título e Autor são obrigatórios'}), 400

            cursor.execute('''
                UPDATE livros 
                SET titulo=%s, autor=%s, isbn=%s, categoria=%s, ano=%s, editora=%s, edicao=%s, descricao=%s
                WHERE id=%s
            ''', (titulo, autor, data.get('isbn'), data.get('categoria'), data.get('ano'), 
                  data.get('editora'), data.get('edicao'), data.get('descricao'), livro_id))
            conn.commit()
            return jsonify({'success': True, 'message': 'Livro atualizado com sucesso!'})

        elif request.method == 'DELETE':
            if current_user.role != 'admin':
                return jsonify({'success': False, 'message': 'Não autorizado'}), 403
            
            livro_id = request.args.get('id')
            if not livro_id:
                return jsonify({'success': False, 'message': 'ID do livro é obrigatório'}), 400
            
            # Verificar se existem exemplares
            cursor.execute('SELECT COUNT(*) as count FROM exemplares WHERE livro_id = %s', (livro_id,))
            result = cursor.fetchone()
            if result and result['count'] > 0:
                return jsonify({'success': False, 'message': 'Não é possível excluir um livro que possui exemplares cadastrados.'}), 400

            cursor.execute('DELETE FROM livros WHERE id = %s', (livro_id,))
            conn.commit()
            return jsonify({'success': True, 'message': 'Livro excluído com sucesso!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/exemplares', methods=['POST', 'GET', 'PUT', 'DELETE'])
@csrf.exempt
@login_required
def api_exemplares():
    conn = get_db_connection()
    if not conn: return jsonify({'success': False}), 500

    try:
        cursor = get_db_cursor(conn)
        
        if request.method == 'POST':
            if current_user.role != 'admin': return jsonify({'success': False}), 403
            data = request.get_json()
            
            livro_id = data.get('livro_id')
            codigo_barras = data.get('codigo_barras')
            
            if not livro_id or not codigo_barras:
                 return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
                 
            cursor.execute('INSERT INTO exemplares (livro_id, codigo_barras, localizacao, observacao) VALUES (%s, %s, %s, %s)',
                         (livro_id, codigo_barras, data.get('localizacao'), data.get('observacao')))
            conn.commit()
            return jsonify({'success': True, 'message': 'Exemplar adicionado!'})
            
        elif request.method == 'GET':
            livro_id = request.args.get('livro_id')
            if livro_id:
                cursor.execute('SELECT * FROM exemplares WHERE livro_id = %s', (livro_id,))
            else:
                 cursor.execute('SELECT * FROM exemplares')
            return jsonify({'success': True, 'data': cursor.fetchall()})

        elif request.method == 'PUT':
            if current_user.role != 'admin': return jsonify({'success': False}), 403
            data = request.get_json()
            exemplar_id = data.get('id')
            
            if not exemplar_id:
                return jsonify({'success': False, 'message': 'ID do exemplar é obrigatório'}), 400
            
            campos = []
            valores = []
            
            if 'codigo_barras' in data:
                campos.append("codigo_barras = %s")
                valores.append(data['codigo_barras'])
            if 'localizacao' in data:
                campos.append("localizacao = %s")
                valores.append(data['localizacao'])
            if 'observacao' in data:
                campos.append("observacao = %s")
                valores.append(data['observacao'])
            if 'status' in data:
                campos.append("status = %s")
                valores.append(data['status'])
                
            if not campos:
                return jsonify({'success': False, 'message': 'Nenhum dado para atualizar'}), 400
                
            valores.append(exemplar_id)
            query = f"UPDATE exemplares SET {', '.join(campos)} WHERE id = %s"
            cursor.execute(query, tuple(valores))
            conn.commit()
            return jsonify({'success': True, 'message': 'Exemplar atualizado!'})

        elif request.method == 'DELETE':
            if current_user.role != 'admin': return jsonify({'success': False}), 403
            exemplar_id = request.args.get('id')
            
            try:
                cursor.execute('DELETE FROM exemplares WHERE id = %s', (exemplar_id,))
                conn.commit()
                return jsonify({'success': True, 'message': 'Exemplar removido!'})
            except mysql.connector.errors.IntegrityError:
                return jsonify({'success': False, 'message': 'Não é possível excluir exemplar com empréstimos ativos ou histórico.'}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
         if conn: conn.close()


# =============================================================================
# ROTAS DE SISTEMA (BACKUP E RESTORE)
# =============================================================================

@app.route('/api/system/backup', methods=['GET'])
@login_required
def system_backup():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Erro de conexão!'}), 500
        
        # Gerar nome do arquivo
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f"backup_apple_academy_{timestamp}.sql"
        
        output = io.StringIO()
        output.write(f"-- Backup Apple Academy Manager\n")
        output.write(f"-- Data: {timestamp}\n\n")
        
        if os.getenv('DB_TYPE') == 'postgres':
             cursor = conn.cursor()
             
             # Listar tabelas
             cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
             tables = [row[0] for row in cursor.fetchall()]
             
             for table in tables:
                output.write(f"\n-- Tabela: {table}\n")
                output.write(f"TRUNCATE TABLE {table} CASCADE;\n")
                
                cursor.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                
                if rows:
                    # Obter nomes das colunas
                    col_names = [desc[0] for desc in cursor.description]
                    cols_str = ', '.join(col_names)
                    
                    for row in rows:
                        vals = []
                        for val in row:
                            if val is None:
                                vals.append('NULL')
                            elif isinstance(val, (int, float)):
                                vals.append(str(val))
                            elif isinstance(val, bool):
                                vals.append('TRUE' if val else 'FALSE')
                            else:
                                # Escape simple single quotes
                                val_str = str(val).replace("'", "''")
                                vals.append(f"'{val_str}'")
                        
                        vals_str = ', '.join(vals)
                        output.write(f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str});\n")

             cursor.close()
             
        else: # MySQL Fallback (embora estejamos usando Postgres agora)
             pass 

        conn.close()
        
        # Preparar download
        mem_file = io.BytesIO()
        mem_file.write(output.getvalue().encode('utf-8'))
        mem_file.seek(0)
        
        return send_file(
            mem_file,
            as_attachment=True,
            download_name=filename,
            mimetype='application/sql'
        )

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro ao gerar backup: {str(e)}'}), 500

@app.route('/api/system/restore', methods=['POST'])
@csrf.exempt  # Exempt from CSRF for file upload
@login_required
def system_restore():
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
        
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Nenhum arquivo enviado'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'Nenhum arquivo selecionado'}), 400

        if not file.filename.endswith('.sql'):
             return jsonify({'success': False, 'message': 'Apenas arquivos .sql são permitidos'}), 400

        # Ler conteúdo
        content = file.read().decode('utf-8')
        
        conn = get_db_connection()
        cursor = conn.cursor()

        # Estratégia simples: Dividir por ; e executar
        # Filtros de compatibilidade MySQL -> Postgres
        statements = content.split(';')
        
        sucessos = 0
        erros = 0
        
        for statement in statements:
            stmt = statement.strip()
            if not stmt: continue
            
            # Ignorar comentários e configurações de lock do MySQL
            if stmt.startswith('LOCK TABLES') or stmt.startswith('UNLOCK TABLES') or stmt.startswith('/*!'):
                continue
                
            # Limpeza básica de sintaxe MySQL se detectado
            if '`' in stmt:
                stmt = stmt.replace('`', '"') # Backticks para quotes
            
            if 'ENGINE=InnoDB' in stmt:
                # Remover definições de engine do MySQL no create table
                stmt = re.sub(r'ENGINE=\w+\s*', '', stmt)
                stmt = re.sub(r'DEFAULT CHARSET=\w+\s*', '', stmt)
                stmt = re.sub(r'COLLATE=\w+\s*', '', stmt)
                
            if 'int NOT NULL AUTO_INCREMENT' in stmt:
                 # Converter auto_increment para SERIAL (simplificado)
                 stmt = stmt.replace('int NOT NULL AUTO_INCREMENT', 'SERIAL')
                 
            try:
                cursor.execute(stmt)
                sucessos += 1
            except Exception as e:
                print(f"Erro no statement: {stmt[:50]}... -> {e}")
                erros += 1
                # Não abortar, tentar o próximo (permissivo)
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'Restauração concluída. Comandos executados: {sucessos}. Erros/Ignorados: {erros}. Recarregue a página.'
        })

    except Exception as e:
        return jsonify({'success': False, 'message': f'Erro crítico no restore: {str(e)}'}), 500
    finally:
         if 'conn' in locals() and conn: conn.close()

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=5001, debug=True)
# Admin User Management Routes
from werkzeug.security import generate_password_hash

@app.route('/api/admin/users', methods=['POST'])
@csrf.exempt
@login_required
def api_create_user():
    """Create new user"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip()
        role = data.get('role', 'user')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Username e senha são obrigatórios!'}), 400
        
        if role not in ['admin', 'user', 'professor']:
            return jsonify({'success': False, 'message': 'Role inválido!'}), 400
        
        cursor = get_db_cursor(conn)
        
        # Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username já existe!'}), 400
        
        # Hash password and insert
        password_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, password, role, email) VALUES (%s, %s, %s, %s)",
            (username, password_hash, role, email if email else None)
        )
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Usuário criado com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar usuário: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@csrf.exempt
@login_required
def api_update_user(user_id):
    """Update existing user"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        role = data.get('role')
        password = data.get('password', '').strip()
        
        if not username:
            return jsonify({'success': False, 'message': 'Username é obrigatório!'}), 400
        
        if role and role not in ['admin', 'user', 'professor']:
            return jsonify({'success': False, 'message': 'Role inválido!'}), 400
        
        cursor = get_db_cursor(conn)
        
        # Check if username is taken by another user
        cursor.execute("SELECT id FROM users WHERE username = %s AND id != %s", (username, user_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Username já existe!'}), 400
        
        # Build update query
        if password:
            password_hash = generate_password_hash(password)
            cursor.execute(
                "UPDATE users SET username = %s, email = %s, role = %s, password = %s WHERE id = %s",
                (username, email if email else None, role, password_hash, user_id)
            )
        else:
            cursor.execute(
                "UPDATE users SET username = %s, email = %s, role = %s WHERE id = %s",
                (username, email if email else None, role, user_id)
            )
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Usuário atualizado com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar usuário: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@csrf.exempt
@login_required
def api_delete_user(user_id):
    """Delete user"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        return jsonify({'success': False, 'message': 'Você não pode excluir seu próprio usuário!'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Usuário excluído com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir usuário: {str(e)}'}), 500
    finally:
        if conn: conn.close()


# Device Types Management Routes

@app.route('/api/admin/tipos-devices', methods=['POST'])
@csrf.exempt
@login_required
def api_create_device_type():
    """Create new device type"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        categoria = data.get('categoria', '').strip()
        descricao = data.get('descricao', '').strip()
        para_emprestimo = data.get('para_emprestimo', True)
        
        if not nome:
            return jsonify({'success': False, 'message': 'Nome é obrigatório!'}), 400
        
        cursor = get_db_cursor(conn)
        
        # Check if name already exists
        cursor.execute("SELECT id FROM tipos_devices WHERE nome = %s", (nome,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Tipo de device com este nome já existe!'}), 400
        
        cursor.execute(
            "INSERT INTO tipos_devices (nome, categoria, descricao, para_emprestimo) VALUES (%s, %s, %s, %s)",
            (nome, categoria, descricao if descricao else None, para_emprestimo)
        )
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Tipo de device criado com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao criar tipo: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/tipos-devices/<int:tipo_id>', methods=['PUT'])
@csrf.exempt
@login_required
def api_update_device_type(tipo_id):
    """Update existing device type"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        data = request.get_json()
        nome = data.get('nome', '').strip()
        categoria = data.get('categoria', '').strip()
        descricao = data.get('descricao', '').strip()
        para_emprestimo = data.get('para_emprestimo', True)
        
        if not nome:
            return jsonify({'success': False, 'message': 'Nome é obrigatório!'}), 400
        
        cursor = get_db_cursor(conn)
        
        # Check if name is taken by another type
        cursor.execute("SELECT id FROM tipos_devices WHERE nome = %s AND id != %s", (nome, tipo_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Tipo de device com este nome já existe!'}), 400
        
        cursor.execute(
            "UPDATE tipos_devices SET nome = %s, categoria = %s, descricao = %s, para_emprestimo = %s WHERE id = %s",
            (nome, categoria, descricao if descricao else None, para_emprestimo, tipo_id)
        )
        
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Tipo de device atualizado com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao atualizar tipo: {str(e)}'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/tipos-devices/<int:tipo_id>', methods=['DELETE'])
@csrf.exempt
@login_required
def api_delete_device_type(tipo_id):
    """Delete device type"""
    if current_user.role != 'admin':
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        cursor = get_db_cursor(conn)
        
        # Check if type is being used by any devices
        cursor.execute("SELECT COUNT(*) as count FROM devices WHERE tipo_id = %s", (tipo_id,))
        result = cursor.fetchone()
        count = result['count'] if 'count' in result else result[0]
        
        if count > 0:
            return jsonify({'success': False, 'message': f'Não é possível excluir. Existem {count} device(s) usando este tipo!'}), 400
        
        cursor.execute("DELETE FROM tipos_devices WHERE id = %s", (tipo_id,))
        conn.commit()
        cursor.close()
        
        return jsonify({'success': True, 'message': 'Tipo de device excluído com sucesso!'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao excluir tipo: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/admin/users/<int:user_id>/foto', methods=['POST'])
@csrf.exempt
@login_required
def upload_user_foto(user_id):
    """Upload user profile photo"""
    if current_user.role != 'admin' and current_user.id != user_id:
        return jsonify({'success': False, 'message': 'Acesso não autorizado!'}), 403
    
    if 'foto' not in request.files:
        return jsonify({'success': False, 'message': 'Nenhuma foto enviada!'}), 400
    
    foto = request.files['foto']
    
    if foto.filename == '':
        return jsonify({'success': False, 'message': 'Nenhuma foto selecionada!'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco!'}), 500
    
    try:
        # Save file
        filename = secure_filename(f"user_{user_id}_{foto.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        foto.save(filepath)
        
        # Update database
        cursor = get_db_cursor(conn)
        cursor.execute(
            "UPDATE users SET foto_path = %s WHERE id = %s",
            (f"uploads/{filename}", user_id)
        )
        conn.commit()
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': 'Foto atualizada com sucesso!',
            'foto_path': f"uploads/{filename}"
        })
        
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': f'Erro ao salvar foto: {str(e)}'}), 500
    finally:
        if conn: conn.close()


if __name__ == '__main__':
    # Em produção, debug deve ser False. Use variável de ambiente FLASK_DEBUG=True para desenvolvimento.
    is_debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=5001, debug=is_debug)
