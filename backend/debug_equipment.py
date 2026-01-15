
from app import app, get_db_connection

with app.app_context():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM equipment_control")
    items = cursor.fetchall()
    print(f"Total items: {len(items)}")
    for item in items:
        print(f"ID: {item['id']}, Serial: {item['numero_serie']}, Status: '{item['status']}', ParaEmprestimo: {item['para_emprestimo']} (Type: {type(item['para_emprestimo'])})")
    conn.close()
