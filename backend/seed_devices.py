from app import app, get_db_connection, get_db_cursor
from datetime import date, timedelta

def seed_devices_and_loans():
    with app.app_context():
        conn = get_db_connection()
        if not conn:
            print("Failed to connect to DB")
            return

        try:
            cursor = get_db_cursor(conn)
            
            # 1. Check if we have device types
            cursor.execute("SELECT COUNT(*) as count FROM tipos_devices")
            result = cursor.fetchone()
            tipo_count = result['count'] if 'count' in result else result[0]
            
            if tipo_count == 0:
                print("No device types found. Creating sample types...")
                cursor.execute("""
                    INSERT INTO tipos_devices (nome, categoria, descricao, para_emprestimo)
                    VALUES 
                    ('iPhone 15 Pro', 'Smartphone', 'Smartphone Apple', true),
                    ('iPad Pro', 'Tablet', 'Tablet Apple', true),
                    ('MacBook Pro', 'Notebook', 'Notebook Apple', true)
                """)
                conn.commit()
            
            # 2. Get a tipo_id for devices
            cursor.execute("SELECT id FROM tipos_devices WHERE para_emprestimo = true LIMIT 1")
            tipo_result = cursor.fetchone()
            tipo_id = tipo_result['id'] if tipo_result else None
            
            if not tipo_id:
                print("No loanable device types available")
                return
            
            # 3. Create sample devices if none exist
            cursor.execute("SELECT COUNT(*) as count FROM devices")
            result = cursor.fetchone()
            device_count = result['count'] if 'count' in result else result[0]
            
            if device_count == 0:
                print("Creating sample devices...")
                devices_data = [
                    ('iPhone 001', 'iPhone 15 Pro', 'SN-IP001', 'Preto', 'Sala 101', 'Disponível'),
                    ('iPhone 002', 'iPhone 15 Pro', 'SN-IP002', 'Branco', 'Sala 101', 'Disponível'),
                    ('iPad 001', 'iPad Pro', 'SN-IPD001', 'Prata', 'Sala 102', 'Disponível'),
                ]
                
                for nome, tipo, serial, cor, local, status in devices_data:
                    cursor.execute("""
                        INSERT INTO devices (nome, tipo, numero_serie, cor, local, status, tipo_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (nome, tipo, serial, cor, local, status, tipo_id))
                
                conn.commit()
                print(f"Created {len(devices_data)} devices")
            
            # 4. Create a sample loan if we have alunos and devices
            cursor.execute("SELECT id FROM alunos LIMIT 1")
            aluno = cursor.fetchone()
            
            cursor.execute("SELECT id FROM devices WHERE status = 'Disponível' LIMIT 1")
            device = cursor.fetchone()
            
            if aluno and device:
                aluno_id = aluno['id'] if isinstance(aluno, dict) else aluno[0]
                device_id = device['id'] if isinstance(device, dict) else device[0]
                
                # Check if loan already exists
                cursor.execute("SELECT COUNT(*) as count FROM emprestimos WHERE status = 'Ativo'")
                result = cursor.fetchone()
                loan_count = result['count'] if 'count' in result else result[0]
                
                if loan_count == 0:
                    print(f"Creating sample loan for Aluno {aluno_id} with Device {device_id}...")
                    today = date.today()
                    
                    cursor.execute("""
                        INSERT INTO emprestimos (aluno_id, device_id, data_retirada, data_devolucao, status)
                        VALUES (%s, %s, %s, %s, 'Ativo')
                    """, (aluno_id, device_id, today, today + timedelta(days=7)))
                    
                    # Update device status
                    cursor.execute("UPDATE devices SET status = 'Emprestado' WHERE id = %s", (device_id,))
                    
                    conn.commit()
                    print("Sample loan created successfully!")
            
            print("Devices and Loans seeded successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"Error seeding: {e}")
            import traceback
            traceback.print_exc()
        finally:
            conn.close()

if __name__ == "__main__":
    seed_devices_and_loans()
