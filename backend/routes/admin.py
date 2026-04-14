from flask import Blueprint, request, jsonify
from routes.auth import admin_required
import sqlite3
import os

admin_bp = Blueprint('admin', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "../database.db")


# ─── Dashboard Stats ─────────────────────────────────────────

@admin_bp.route('/admin/dashboard', methods=['GET'])
@admin_required
def dashboard():
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM users WHERE role='user'")
    total_users = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM products WHERE is_active=1")
    total_products = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM orders")
    total_orders = cur.fetchone()[0]

    cur.execute("SELECT COALESCE(SUM(total), 0) FROM orders")
    total_revenue = cur.fetchone()[0]

    cur.execute("""
        SELECT products.name, SUM(orders.quantity) as sold
        FROM orders JOIN products ON orders.product_id = products.id
        GROUP BY products.name ORDER BY sold DESC LIMIT 5
    """)
    top_products = [{"name": r[0], "sold": r[1]} for r in cur.fetchall()]

    cur.execute("""
        SELECT users.name, COUNT(orders.id) as order_count, COALESCE(SUM(orders.total),0) as spent
        FROM orders JOIN users ON orders.user_id = users.id
        GROUP BY users.id ORDER BY spent DESC LIMIT 5
    """)
    top_users = [{"name": r[0], "orders": r[1], "spent": r[2]} for r in cur.fetchall()]

    cur.execute("""
        SELECT strftime('%d %b', created_at) as day, COALESCE(SUM(total),0)
        FROM orders GROUP BY day ORDER BY created_at DESC LIMIT 7
    """)
    revenue_chart = [{"day": r[0], "revenue": r[1]} for r in reversed(cur.fetchall())]

    conn.close()

    return jsonify({
        "total_users":    total_users,
        "total_products": total_products,
        "total_orders":   total_orders,
        "total_revenue":  total_revenue,
        "top_products":   top_products,
        "top_users":      top_users,
        "revenue_chart":  revenue_chart,
    })


# ─── Manage Users ─────────────────────────────────────────────

@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()

    users = [
        {"id": r[0], "name": r[1], "email": r[2],
         "role": r[3], "is_active": bool(r[4]), "created_at": r[5]}
        for r in rows
    ]
    return jsonify(users)


@admin_bp.route('/admin/users/<int:user_id>/toggle', methods=['PUT'])
@admin_required
def toggle_user(user_id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT is_active FROM users WHERE id=?", (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "User not found"}), 404
    new_status = 0 if row[0] else 1
    cur.execute("UPDATE users SET is_active=? WHERE id=?", (new_status, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "User status updated", "is_active": bool(new_status)})


@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("DELETE FROM users WHERE id=? AND role != 'admin'", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "User deleted"})


# ─── All Orders ───────────────────────────────────────────────

@admin_bp.route('/admin/orders', methods=['GET'])
@admin_required
def get_all_orders():
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("""
        SELECT orders.id, users.name, products.name,
               orders.quantity, orders.total, orders.status, orders.created_at
        FROM orders
        JOIN users    ON orders.user_id    = users.id
        JOIN products ON orders.product_id = products.id
        ORDER BY orders.id DESC
    """)
    rows = cur.fetchall()
    conn.close()

    orders = [
        {"id": r[0], "user": r[1], "product": r[2],
         "quantity": r[3], "total": r[4], "status": r[5], "created_at": r[6]}
        for r in rows
    ]
    return jsonify(orders)


@admin_bp.route('/admin/orders/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    data   = request.json
    status = data.get("status", "delivered")
    conn   = sqlite3.connect(db_path)
    cur    = conn.cursor()
    cur.execute("UPDATE orders SET status=? WHERE id=?", (status, order_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Order status updated"})


# ─── Product CRUD ─────────────────────────────────────────────

@admin_bp.route('/admin/products', methods=['GET'])
@admin_required
def get_all_products():
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT id, name, price, description, image, stock, weight, is_active FROM products ORDER BY id DESC")
    rows = cur.fetchall()
    conn.close()
    products = [
        {"id": r[0], "name": r[1], "price": r[2], "description": r[3],
         "image": r[4], "stock": r[5], "weight": r[6], "is_active": bool(r[7])}
        for r in rows
    ]
    return jsonify(products)


@admin_bp.route('/admin/products', methods=['POST'])
@admin_required
def add_product():
    data = request.json
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO products (name, price, description, image, stock, weight)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get("name"), data.get("price"), data.get("description"),
        data.get("image", ""), data.get("stock", 100), data.get("weight", "")
    ))
    conn.commit()
    product_id = cur.lastrowid
    conn.close()
    return jsonify({"message": "Product added", "id": product_id}), 201


@admin_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    data = request.json
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("""
        UPDATE products SET name=?, price=?, description=?, stock=?, weight=?, is_active=?
        WHERE id=?
    """, (
        data.get("name"), data.get("price"), data.get("description"),
        data.get("stock"), data.get("weight"), int(data.get("is_active", 1)),
        product_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product updated"})


@admin_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("DELETE FROM products WHERE id=?", (product_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product deleted"})