
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
