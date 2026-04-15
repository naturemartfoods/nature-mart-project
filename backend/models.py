import os
import psycopg2
from werkzeug.security import generate_password_hash

DATABASE_URL = os.environ.get("DATABASE_URL")


def connect_db():
    return psycopg2.connect(DATABASE_URL)


def create_tables():
    conn = connect_db()
    cur  = conn.cursor()

    # USERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT UNIQUE NOT NULL,
        password   TEXT NOT NULL,
        role       TEXT DEFAULT 'user',
        is_active  INTEGER DEFAULT 1,
        created_at TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
    )
    """)

    # PRODUCTS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        price       INTEGER NOT NULL,
        description TEXT,
        image       TEXT,
        stock       INTEGER DEFAULT 100,
        weight      TEXT,
        is_active   INTEGER DEFAULT 1
    )
    """)

    # CART
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cart (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL DEFAULT 1,
        product_id INTEGER NOT NULL,
        quantity   INTEGER DEFAULT 1,
        FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    """)

    # ORDERS — includes delivery + payment fields used by checkout
    cur.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL DEFAULT 1,
        product_id     INTEGER,
        quantity       INTEGER,
        price          REAL,
        total          REAL,
        name           TEXT,
        phone          TEXT,
        address        TEXT,
        payment_method TEXT DEFAULT 'cod',
        status         TEXT DEFAULT 'placed',
        created_at     TEXT DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Add missing columns to orders if table already exists (safe migration)
    for col, definition in [
        ("name",           "TEXT"),
        ("phone",          "TEXT"),
        ("address",        "TEXT"),
        ("payment_method", "TEXT DEFAULT 'cod'"),
    ]:
        try:
            cur.execute(f"ALTER TABLE orders ADD COLUMN IF NOT EXISTS {col} {definition}")
        except Exception:
            conn.rollback()

    # Default admin account
    cur.execute("SELECT id FROM users WHERE role='admin' LIMIT 1")
    if not cur.fetchone():
        hashed = generate_password_hash("admin123")
        cur.execute("""
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, 'admin')
        """, ("Admin", "admin@naturemart.com", hashed))
        print("✅ Default admin created: admin@naturemart.com / admin123")

    conn.commit()
    conn.close()
    print("✅ DB tables ready")