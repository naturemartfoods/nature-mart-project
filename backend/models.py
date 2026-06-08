import os
import psycopg2
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()  # ← ADDED

DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)


def connect_db():
    if not DATABASE_URL:
        raise Exception("DATABASE_URL is not set! Check your .env file.")
    return psycopg2.connect(DATABASE_URL, sslmode='require')


def create_tables():
    conn = connect_db()
    cur  = conn.cursor()

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

    for col, definition in [
        ("phone",        "TEXT"),
        ("address_line", "TEXT"),
        ("city",         "TEXT"),
        ("state",        "TEXT"),
        ("pincode",      "TEXT"),
    ]:
        try:
            cur.execute(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {definition}")
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"[users migration] {col}: {e}")

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

    cur.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id             SERIAL PRIMARY KEY,
        order_id       TEXT,
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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            price       INTEGER NOT NULL,
            description TEXT,
            image       TEXT,
            stock       INTEGER DEFAULT 100,
            weight      TEXT,
            is_active   INTEGER DEFAULT 1,
            price_250g  INTEGER DEFAULT 0,
            price_500g  INTEGER DEFAULT 0,
            price_1kg   INTEGER DEFAULT 0
        )
        """)

    # Also add migration for existing DB:
    for col, definition in [
        ("price_250g", "INTEGER DEFAULT 0"),
        ("price_500g", "INTEGER DEFAULT 0"),
        ("price_1kg",  "INTEGER DEFAULT 0"),
    ]:
        try:
            cur.execute(f"ALTER TABLE products ADD COLUMN IF NOT EXISTS {col} {definition}")
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"[products migration] {col}: {e}")

    for col, definition in [
        ("order_id",       "TEXT"),
        ("name",           "TEXT"),
        ("phone",          "TEXT"),
        ("address",        "TEXT"),
        ("payment_method", "TEXT DEFAULT 'cod'"),
    ]:
        try:
            cur.execute(f"ALTER TABLE orders ADD COLUMN IF NOT EXISTS {col} {definition}")
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"[orders migration] {col}: {e}")

    try:
        cur.execute("CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders (order_id)")
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"[index migration] order_id index: {e}")

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