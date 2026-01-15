# Adicionar esta rota ao app.py após a rota /alunos

@app.route('/api/alunos/lista', methods=['GET'])
@login_required
def api_alunos_lista():
    """API para listar todos os alunos"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Erro de conexão com o banco'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM alunos ORDER BY nome')
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
                'foto_path': aluno.get('foto_path')
            })
        
        return jsonify({
            'success': True,
            'data': alunos_list,
            'total': len(alunos_list)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro ao carregar alunos: {str(e)}'
        }), 500
    finally:
        if conn.is_connected():
            conn.close()
