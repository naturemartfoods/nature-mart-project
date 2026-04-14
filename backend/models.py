# import sqlite3
# import os

# # Get correct folder path
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DB_PATH = os.path.join(BASE_DIR, "database.db")

# def connect_db():
#     return sqlite3.connect(DB_PATH)

# def create_tables():
#     conn = connect_db()
#     cur = conn.cursor()

#     # USERS
#     cur.execute("""
#     CREATE TABLE IF NOT EXISTS users (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         name TEXT,
#         email TEXT UNIQUE,
#         password TEXT
#     )
#     """)

#     # PRODUCTS
#     cur.execute("""
#     CREATE TABLE IF NOT EXISTS products (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         name TEXT,
#         price INTEGER,
#         description TEXT,
#         image TEXT,
#         stock INTEGER,
#         weight TEXT
#     )
#     """)

#     conn.commit()
#     conn.close()


import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")

def connect_db():
    return sqlite3.connect(DB_PATH)

def create_tables():
    conn = connect_db()
    cur = conn.cursor()

    # USERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        role       TEXT DEFAULT 'user',
        is_active  INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )
    """)

    # Migrate existing users table — add new columns if missing
    for col, definition in [
        ("role",       "TEXT DEFAULT 'user'"),
        ("is_active",  "INTEGER DEFAULT 1"),
        ("created_at", "TEXT DEFAULT (datetime('now'))"),
    ]:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN {col} {definition}")
        except Exception:
            pass

    # PRODUCTS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        price       INTEGER NOT NULL,
        description TEXT,
        image       TEXT,
        stock       INTEGER DEFAULT 100,
        weight      TEXT,
        is_active   INTEGER DEFAULT 1
    )
    """)

    try:
        cur.execute("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1")
    except Exception:
        pass

    # CART — per-user cart
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL DEFAULT 1,
        product_id INTEGER NOT NULL,
        quantity   INTEGER DEFAULT 1,
        FOREIGN KEY (user_id)    REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    )
    """)

    try:
        cur.execute("ALTER TABLE cart ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1")
    except Exception:
        pass

    # ORDERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL DEFAULT 1,
        product_id INTEGER,
        quantity   INTEGER,
        price      REAL,
        total      REAL,
        status     TEXT DEFAULT 'delivered',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    for col, definition in [
        ("user_id",    "INTEGER NOT NULL DEFAULT 1"),
        ("status",     "TEXT DEFAULT 'delivered'"),
        ("created_at", "TEXT DEFAULT (datetime('now'))"),
    ]:
        try:
            cur.execute(f"ALTER TABLE orders ADD COLUMN {col} {definition}")
        except Exception:
            pass

    # Default admin account
    cur.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
    if not cur.fetchone():
        hashed = generate_password_hash("admin123")
        cur.execute("""
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, 'admin')
        """, ("Admin", "admin@naturemart.com", hashed))
        print("✅ Default admin created: admin@naturemart.com / admin123")

    conn.commit()
    conn.close()
    print("✅ DB tables ready")