#!/usr/bin/env python3
"""
Script para verificar quantos equipamentos atendem aos critérios:
- status = 'Disponível'
- para_emprestimo = 1
"""

from database import get_db_connection

def main():
    conn = get_db_connection()
    if not conn:
        print("❌ Erro ao conectar com o banco de dados")
        return
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # 1. Total de equipamentos
        cursor.execute('SELECT COUNT(*) as total FROM equipment_control')
        total = cursor.fetchone()['total']
        print(f"📊 Total de equipamentos no equipment_control: {total}")
        
        # 2. Equipamentos com para_emprestimo = 1
        cursor.execute('SELECT COUNT(*) as total FROM equipment_control WHERE para_emprestimo = 1')
        para_emprestimo = cursor.fetchone()['total']
        print(f"📊 Equipamentos com para_emprestimo = 1: {para_emprestimo}")
        
        # 3. Equipamentos com status = 'Disponível'
        cursor.execute("SELECT COUNT(*) as total FROM equipment_control WHERE status = 'Disponível'")
        disponiveis = cursor.fetchone()['total']
        print(f"📊 Equipamentos com status = 'Disponível': {disponiveis}")
        
        # 4. Equipamentos com AMBOS os critérios (o que deveria aparecer na lista)
        cursor.execute("SELECT COUNT(*) as total FROM equipment_control WHERE status = 'Disponível' AND para_emprestimo = 1")
        resultado_correto = cursor.fetchone()['total']
        print(f"\n✅ Equipamentos que DEVEM aparecer (status='Disponível' E para_emprestimo=1): {resultado_correto}")
        
        # 5. Mostrar distribuição por status
        print("\n📈 Distribuição por STATUS:")
        cursor.execute("SELECT status, COUNT(*) as total FROM equipment_control GROUP BY status ORDER BY total DESC")
        for row in cursor.fetchall():
            print(f"   - {row['status']}: {row['total']}")
        
        # 6. Mostrar alguns exemplos de equipamentos disponíveis e para empréstimo
        if resultado_correto > 0:
            print(f"\n📋 Primeiros 5 equipamentos com status='Disponível' e para_emprestimo=1:")
            cursor.execute("""
                SELECT tipo_device, numero_serie, modelo, status, para_emprestimo 
                FROM equipment_control 
                WHERE status = 'Disponível' AND para_emprestimo = 1 
                LIMIT 5
            """)
            for i, eq in enumerate(cursor.fetchall(), 1):
                print(f"   {i}. {eq['tipo_device']} - {eq['numero_serie']} - Status: {eq['status']}")
        else:
            print("\n⚠️  PROBLEMA IDENTIFICADO: Não há NENHUM equipamento com status='Disponível' E para_emprestimo=1!")
            print("\n🔍 Vamos verificar o que existe:")
            cursor.execute("""
                SELECT tipo_device, numero_serie, modelo, status, para_emprestimo 
                FROM equipment_control 
                LIMIT 10
            """)
            print("   Primeiros 10 equipamentos:")
            for i, eq in enumerate(cursor.fetchall(), 1):
                para_emp = "Sim" if eq['para_emprestimo'] else "Não"
                print(f"   {i}. {eq['tipo_device']} - {eq['numero_serie']} - Status: {eq['status']} - Para empréstimo: {para_emp}")
        
        cursor.close()
        
    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        if conn.is_connected():
            conn.close()

if __name__ == '__main__':
    main()
