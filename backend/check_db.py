from dotenv import load_dotenv
import os

# Load .env file first before importing models
load_dotenv()

from models import connect_db

conn = connect_db()
cur = conn.cursor()

# Check products
cur.execute("SELECT COUNT(*) FROM products")
print("Total products:", cur.fetchone()[0])

cur.execute("SELECT id, name, price, is_active FROM products")
rows = cur.fetchall()
if rows:
    for row in rows:
        print(row)
else:
    print("❌ Products table is EMPTY")

# Check users
cur.execute("SELECT id, name, email, role FROM users")
print("\nUsers:")
for row in cur.fetchall():
    print(row)

conn.close()