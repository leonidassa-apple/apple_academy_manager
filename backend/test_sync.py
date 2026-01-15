import os
import sys
from datetime import datetime

# Adicionar o diretório atual ao path para importar app.py
sys.path.append('/app')

from app import get_db_connection, upsert_device_from_equipment, get_db_cursor

def test_upsert():
    conn = get_db_connection()
    if not conn:
        print("Falha ao conectar ao banco")
        return

    try:
        data = {
            'tipo_device': 'MacBook Pro TEST',
            'numero_serie': 'SN-SYNC-TEST-001',
            'modelo': 'M2 Max',
            'cor': 'Gray',
            'status': 'Disponível',
            'para_emprestimo': True,
            'responsavel': 'Teste Sync',
            'local': 'Lab 1',
            'convenio': 'Apple',
            'observacao': 'Teste de sincronização',
            'processador': 'M2 Max',
            'memoria': '32GB',
            'armazenamento': '1TB',
            'tela': '14'
        }
        
        # Limpeza prévia
        cursor = get_db_cursor(conn)
        cursor.execute("DELETE FROM devices WHERE numero_serie = %s", (data['numero_serie'],))
        cursor.execute("DELETE FROM equipment_control WHERE numero_serie = %s", (data['numero_serie'],))
        conn.commit()

        print(f"Testando upsert para serial: {data['numero_serie']}")
        
        # 1. Inserir no equipment_control
        cursor = get_db_cursor(conn)
        cursor.execute('''INSERT INTO equipment_control (tipo_device, numero_serie, modelo, cor, status, para_emprestimo, data_cadastro)
                          VALUES (%s, %s, %s, %s, %s, %s, %s)''',
                       (data['tipo_device'], data['numero_serie'], data['modelo'], data['cor'], data['status'], data['para_emprestimo'], datetime.now().date()))
        conn.commit()
        
        # 2. Chamar upsert
        upsert_device_from_equipment(conn, data)
        
        # 3. Verificar na tabela devices
        cursor.execute("SELECT * FROM devices WHERE numero_serie = %s", (data['numero_serie'],))
        device = cursor.fetchone()
        
        if device:
            print(f"Sucesso! Dispositivo encontrado na tabela devices: {device['nome']}")
        else:
            print("Falha! Dispositivo NÃO encontrado na tabela devices")
            
        cursor.close()
    except Exception as e:
        print(f"Erro durante o teste: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_upsert()
