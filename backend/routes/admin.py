
  
# import os
# import uuid
# from flask import Blueprint, request, jsonify
# from routes.auth import admin_required
# from models import connect_db

# admin_bp = Blueprint('admin', __name__)


# # ─── Dashboard Stats ─────────────────────────────────────────

# @admin_bp.route('/admin/dashboard', methods=['GET'])
# @admin_required
# def dashboard():
#     conn = connect_db()
#     cur  = conn.cursor()

#     cur.execute("SELECT COUNT(*) FROM users WHERE role='user'")
#     total_users = cur.fetchone()[0]

#     cur.execute("SELECT COUNT(*) FROM products WHERE is_active=1")
#     total_products = cur.fetchone()[0]

#     cur.execute("SELECT COUNT(*) FROM orders")
#     total_orders = cur.fetchone()[0]

#     cur.execute("SELECT COALESCE(SUM(total), 0) FROM orders")
#     total_revenue = cur.fetchone()[0]

#     cur.execute("""
#         SELECT products.name, SUM(orders.quantity) as sold
#         FROM orders JOIN products ON orders.product_id = products.id
#         GROUP BY products.name ORDER BY sold DESC LIMIT 5
#     """)
#     top_products = [{"name": r[0], "sold": r[1]} for r in cur.fetchall()]

#     cur.execute("""
#         SELECT users.name, COUNT(orders.id) as order_count, COALESCE(SUM(orders.total),0) as spent
#         FROM orders JOIN users ON orders.user_id = users.id
#         GROUP BY users.id, users.name ORDER BY spent DESC LIMIT 5
#     """)
#     top_users = [{"name": r[0], "orders": r[1], "spent": r[2]} for r in cur.fetchall()]

#     cur.execute("""
#         SELECT to_char(created_at::timestamp, 'DD Mon') as day, COALESCE(SUM(total),0)
#         FROM orders GROUP BY day ORDER BY MIN(created_at) DESC LIMIT 7
#     """)
#     revenue_chart = [{"day": r[0], "revenue": r[1]} for r in reversed(cur.fetchall())]

#     conn.close()
#     return jsonify({
#         "total_users":    total_users,
#         "total_products": total_products,
#         "total_orders":   total_orders,
#         "total_revenue":  total_revenue,
#         "top_products":   top_products,
#         "top_users":      top_users,
#         "revenue_chart":  revenue_chart,
#     })


# # ─── Manage Users ─────────────────────────────────────────────

# @admin_bp.route('/admin/users', methods=['GET'])
# @admin_required
# def get_all_users():
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id DESC")
#     rows = cur.fetchall()
#     conn.close()

#     users = [
#         {"id": r[0], "name": r[1], "email": r[2],
#          "role": r[3], "is_active": bool(r[4]), "created_at": r[5]}
#         for r in rows
#     ]
#     return jsonify(users)


# @admin_bp.route('/admin/users/<int:user_id>/toggle', methods=['PUT'])
# @admin_required
# def toggle_user(user_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("SELECT is_active FROM users WHERE id=%s", (user_id,))
#     row = cur.fetchone()
#     if not row:
#         conn.close()
#         return jsonify({"error": "User not found"}), 404
#     new_status = 0 if row[0] else 1
#     cur.execute("UPDATE users SET is_active=%s WHERE id=%s", (new_status, user_id))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "User status updated", "is_active": bool(new_status)})


# @admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
# @admin_required
# def delete_user(user_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("DELETE FROM users WHERE id=%s AND role != 'admin'", (user_id,))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "User deleted"})


# # ─── All Orders ───────────────────────────────────────────────

# @admin_bp.route('/admin/orders', methods=['GET'])
# @admin_required
# def get_all_orders():
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("""
#         SELECT orders.id, users.name, products.name,
#                orders.quantity, orders.total, orders.status, orders.created_at
#         FROM orders
#         JOIN users    ON orders.user_id    = users.id
#         JOIN products ON orders.product_id = products.id
#         ORDER BY orders.id DESC
#     """)
#     rows = cur.fetchall()
#     conn.close()

#     orders = [
#         {"id": r[0], "user": r[1], "product": r[2],
#          "quantity": r[3], "total": r[4], "status": r[5], "created_at": r[6]}
#         for r in rows
#     ]
#     return jsonify(orders)


# @admin_bp.route('/admin/orders/<int:order_id>/status', methods=['PUT'])
# @admin_required
# def update_order_status(order_id):
#     data   = request.json
#     status = data.get("status", "delivered")
#     conn   = connect_db()
#     cur    = conn.cursor()
#     cur.execute("UPDATE orders SET status=%s WHERE id=%s", (status, order_id))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Order status updated"})


# # ─── Upload Product Image ──────────────────────────────────────

# @admin_bp.route('/admin/products/upload-image', methods=['POST'])
# @admin_required
# def upload_image():
#     if 'image' not in request.files:
#         return jsonify({"error": "No image file provided"}), 400

#     file = request.files['image']

#     if file.filename == '':
#         return jsonify({"error": "No file selected"}), 400

#     # Allow only image file types
#     allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
#     ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
#     if ext not in allowed_extensions:
#         return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400

#     # Generate unique filename to avoid collisions
#     filename = f"{uuid.uuid4().hex}.{ext}"

#     # Save to backend/images/ folder
#     BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#     images_dir = os.path.join(BASE_DIR, '..', 'images')
#     os.makedirs(images_dir, exist_ok=True)  # create folder if it doesn't exist

#     save_path = os.path.join(images_dir, filename)
#     file.save(save_path)

#     # Return the URL path that frontend will use to display the image
#     return jsonify({"image_url": f"/images/{filename}"}), 201


# # ─── Product CRUD ─────────────────────────────────────────────

# @admin_bp.route('/admin/products', methods=['GET'])
# @admin_required
# def get_all_products():
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("SELECT id, name, price, description, image, stock, weight, is_active FROM products ORDER BY id DESC")
#     rows = cur.fetchall()
#     conn.close()
#     products = [
#         {"id": r[0], "name": r[1], "price": r[2], "description": r[3],
#          "image": r[4], "stock": r[5], "weight": r[6], "is_active": bool(r[7])}
#         for r in rows
#     ]
#     return jsonify(products)


# @admin_bp.route('/admin/products', methods=['POST'])
# @admin_required
# def add_product():
#     data = request.json
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("""
#         INSERT INTO products (name, price, description, image, stock, weight)
#         VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
#     """, (
#         data.get("name"), data.get("price"), data.get("description"),
#         data.get("image", ""), data.get("stock", 100), data.get("weight", "")
#     ))
#     product_id = cur.fetchone()[0]
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Product added", "id": product_id}), 201


# @admin_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
# @admin_required
# def update_product(product_id):
#     data = request.json
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("""
#         UPDATE products SET name=%s, price=%s, description=%s, image=%s, stock=%s, weight=%s, is_active=%s
#         WHERE id=%s
#     """, (
#         data.get("name"), data.get("price"), data.get("description"),
#         data.get("image", ""), data.get("stock"), data.get("weight"),
#         int(data.get("is_active", 1)), product_id
#     ))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Product updated"})


# @admin_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
# @admin_required
# def delete_product(product_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Product deleted"})


import os
import uuid
from flask import Blueprint, request, jsonify
from routes.auth import admin_required
from models import connect_db

admin_bp = Blueprint('admin', __name__)


# ─── Dashboard Stats ─────────────────────────────────────────

@admin_bp.route('/admin/dashboard', methods=['GET'])
@admin_required
def dashboard():
    conn = connect_db()
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
        GROUP BY users.id, users.name ORDER BY spent DESC LIMIT 5
    """)
    top_users = [{"name": r[0], "orders": r[1], "spent": r[2]} for r in cur.fetchall()]

    cur.execute("""
        SELECT to_char(created_at::timestamp, 'DD Mon') as day, COALESCE(SUM(total),0)
        FROM orders GROUP BY day ORDER BY MIN(created_at) DESC LIMIT 7
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
    conn = connect_db()
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
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("SELECT is_active FROM users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "User not found"}), 404
    new_status = 0 if row[0] else 1
    cur.execute("UPDATE users SET is_active=%s WHERE id=%s", (new_status, user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "User status updated", "is_active": bool(new_status)})


@admin_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM users WHERE id=%s AND role != 'admin'", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "User deleted"})


# ─── All Orders ───────────────────────────────────────────────

@admin_bp.route('/admin/orders', methods=['GET'])
@admin_required
def get_all_orders():
    conn = connect_db()
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
    conn   = connect_db()
    cur    = conn.cursor()
    cur.execute("UPDATE orders SET status=%s WHERE id=%s", (status, order_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Order status updated"})


# ─── Upload Product Image ──────────────────────────────────────

@admin_bp.route('/admin/products/upload-image', methods=['POST'])
@admin_required
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_extensions:
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400
    filename  = f"{uuid.uuid4().hex}.{ext}"
    BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
    images_dir = os.path.join(BASE_DIR, '..', 'images')
    os.makedirs(images_dir, exist_ok=True)
    file.save(os.path.join(images_dir, filename))
    return jsonify({"image_url": f"/images/{filename}"}), 201


# ─── Product CRUD ─────────────────────────────────────────────

@admin_bp.route('/admin/products', methods=['GET'])
@admin_required
def get_all_products():
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, name, price, description, image, stock, weight, is_active,
               price_250g, price_500g, price_1kg
        FROM products ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    products = [
        {
            "id": r[0], "name": r[1], "price": r[2], "description": r[3],
            "image": r[4], "stock": r[5], "weight": r[6], "is_active": bool(r[7]),
            "price_250g": r[8] or 0, "price_500g": r[9] or 0, "price_1kg": r[10] or 0,
        }
        for r in rows
    ]
    return jsonify(products)


@admin_bp.route('/admin/products', methods=['POST'])
@admin_required
def add_product():
    data = request.json
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO products (name, price, description, image, stock, weight,
                              price_250g, price_500g, price_1kg)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
    """, (
        data.get("name"),
        data.get("price_250g") or data.get("price", 0),   # fallback: use 250g price as default price
        data.get("description"),
        data.get("image", ""),
        data.get("stock", 100),
        data.get("weight", ""),
        data.get("price_250g", 0),
        data.get("price_500g", 0),
        data.get("price_1kg", 0),
    ))
    product_id = cur.fetchone()[0]
    conn.commit()
    conn.close()
    return jsonify({"message": "Product added", "id": product_id}), 201


@admin_bp.route('/admin/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    data = request.json
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE products
        SET name=%s, price=%s, description=%s, image=%s, stock=%s, weight=%s,
            is_active=%s, price_250g=%s, price_500g=%s, price_1kg=%s
        WHERE id=%s
    """, (
        data.get("name"),
        data.get("price_250g") or data.get("price", 0),
        data.get("description"),
        data.get("image", ""),
        data.get("stock"),
        data.get("weight"),
        int(data.get("is_active", 1)),
        data.get("price_250g", 0),
        data.get("price_500g", 0),
        data.get("price_1kg", 0),
        product_id,
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product updated"})


@admin_bp.route('/admin/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM products WHERE id=%s", (product_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Product deleted"})