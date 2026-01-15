import os
import datetime
import subprocess
import zipfile
import mysql.connector
import shutil

# Configuration
DB_HOST = "10.45.57.248"
DB_USER = "root"
DB_PASS = "Academy2024#@!"
DB_NAME = "apple_academy"
CONTAINER_NAME = "apple-academy-manager"
IMAGE_NAME = "apple_academy_manager-apple-academy"

# Setup Timestamp and Directories
TIMESTAMP = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
BACKUP_ROOT = os.path.join(os.getcwd(), "backups")
BACKUP_DIR = os.path.join(BACKUP_ROOT, f"full_backup_{TIMESTAMP}")
os.makedirs(BACKUP_DIR, exist_ok=True)

print(f"🚀 Starting Full Backup: {TIMESTAMP}")
print(f"📂 Destination: {BACKUP_DIR}")

def simple_dump(host, user, password, database, output_file):
    try:
        conn = mysql.connector.connect(
            host=host, user=user, password=password, database=database
        )
        cursor = conn.cursor()
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"-- Backup of {database} \n")
            f.write(f"-- Date: {datetime.datetime.now()}\n\n")
            
            # Get Tables
            cursor.execute("SHOW TABLES")
            tables = [row[0] for row in cursor.fetchall()]
            
            for table in tables:
                # Structure
                cursor.execute(f"SHOW CREATE TABLE {table}")
                create_stmt = cursor.fetchone()[1]
                f.write(f"DROP TABLE IF EXISTS `{table}`;\n")
                f.write(f"{create_stmt};\n\n")
                
                # Data
                cursor.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                if rows:
                    f.write(f"LOCK TABLES `{table}` WRITE;\n")
                    f.write(f"INSERT INTO `{table}` VALUES \n")
                    
                    values_list = []
                    for row in rows:
                        formatted_row = []
                        for val in row:
                            if val is None:
                                formatted_row.append("NULL")
                            elif isinstance(val, (int, float)):
                                formatted_row.append(str(val))
                            elif isinstance(val, datetime.date) or isinstance(val, datetime.datetime):
                                formatted_row.append(f"'{val}'")
                            else:
                                escaped_val = str(val).replace("'", "''").replace("\\", "\\\\")
                                formatted_row.append(f"'{escaped_val}'")
                        values_list.append(f"({', '.join(formatted_row)})")
                    
                    f.write(",\n".join(values_list))
                    f.write(";\n")
                    f.write(f"UNLOCK TABLES;\n\n")
            
        print(f"✅ Database dumped to: {output_file}")
        return True
    except Exception as e:
        print(f"❌ Python DB Dump failed: {e}")
        return False
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()

# 1. Database Dump
print("\n[1/3] Dumping Database...")
db_file = os.path.join(BACKUP_DIR, f"{DB_NAME}_dump.sql")
simple_dump(DB_HOST, DB_USER, DB_PASS, DB_NAME, db_file)

# 2. Project Files Backup
print("\n[2/3] Zipping Project Files...")
zip_file = os.path.join(BACKUP_DIR, "project_files.zip")
excludes = {'.venv', 'venv', '__pycache__', '.git', 'backups', '.DS_Store', 'backup_venv'}

def should_include(path):
    parts = path.split(os.sep)
    for part in parts:
        if part in excludes:
            return False
    return True

try:
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(os.getcwd()):
            # Filter directories in-place to avoid walking them
            dirs[:] = [d for d in dirs if d not in excludes]
            
            for file in files:
                if file in excludes or file.endswith('.zip') or file.endswith('.tar'):
                    continue
                
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, os.getcwd())
                
                if should_include(rel_path):
                    zipf.write(abs_path, rel_path)
    print(f"✅ Project files zipped to: {zip_file}")
except Exception as e:
    print(f"❌ File zip failed: {e}")

# 3. Docker Image Export
print("\n[3/3] Exporting Docker Image...")
image_file = os.path.join(BACKUP_DIR, "docker_image.tar")
try:
    # Save the image
    cmd = ["docker", "save", "-o", image_file, IMAGE_NAME]
    subprocess.check_call(cmd)
    print(f"✅ Docker image exported to: {image_file}")
except Exception as e:
    print(f"❌ Docker export failed: {e}")
    # Fallback to saving by container name if image name is wrong
    try:
         print("Retrying with container commit...")
         subprocess.check_call(["docker", "commit", CONTAINER_NAME, "backup_img"])
         subprocess.check_call(["docker", "save", "-o", image_file, "backup_img"])
         print(f"✅ Docker image (from commit) exported to: {image_file}")
    except Exception as e2:
         print(f"❌ Retry failed: {e2}")

print("\n✨ Backup Complete!")
