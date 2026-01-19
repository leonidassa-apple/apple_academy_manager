# Admin User Management Routes
from werkzeug.security import generate_password_hash

@app.route('/api/admin/users', methods=['POST'])
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
        app.logger.error(f"Erro ao criar usuário: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao criar usuário.'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
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
        app.logger.error(f"Erro ao atualizar usuário: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao atualizar usuário.'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
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
        app.logger.error(f"Erro ao excluir usuário: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao excluir usuário.'}), 500
    finally:
        if conn: conn.close()


# Device Types Management Routes

@app.route('/api/admin/tipos-devices', methods=['POST'])
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
        app.logger.error(f"Erro ao criar tipo de device: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao criar tipo de dispositivo.'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/tipos-devices/<int:tipo_id>', methods=['PUT'])
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
        app.logger.error(f"Erro ao atualizar tipo de device: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao atualizar tipo de dispositivo.'}), 500
    finally:
        if conn: conn.close()


@app.route('/api/admin/tipos-devices/<int:tipo_id>', methods=['DELETE'])
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
        app.logger.error(f"Erro ao excluir tipo de device: {str(e)}", exc_info=True)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Erro interno ao excluir tipo de dispositivo.'}), 500
    finally:
        if conn: conn.close()
