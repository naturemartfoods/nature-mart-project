# from flask import Blueprint, request, jsonify
# import sqlite3
# import os

# cart_bp = Blueprint('cart', __name__)

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# db_path = os.path.join(BASE_DIR, "../database.db")
# print("CART DB:", db_path)

# # Add to cart
# @cart_bp.route('/cart', methods=['POST'])
# def add_to_cart():
#     data = request.json
#     product_id = data.get("product_id")

#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("SELECT * FROM cart WHERE product_id=?", (product_id,))
#     item = cursor.fetchone()

#     if item:
#         cursor.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=?", (product_id,))
#     else:
#         cursor.execute("INSERT INTO cart (product_id, quantity) VALUES (?, 1)", (product_id,))

#     conn.commit()
#     conn.close()

#     return {"message": "Added to cart"}




# # Get cart
# @cart_bp.route('/cart', methods=['GET'])
# def get_cart():
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("""
#     SELECT products.id, products.name, products.price, products.image, cart.quantity
#     FROM cart
#     JOIN products ON cart.product_id = products.id
#     """)

#     rows = cursor.fetchall()
#     conn.close()

#     cart_items = []
#     total = 0

#     for row in rows:
#         subtotal = row[2] * row[4]
#         total += subtotal

#         cart_items.append({
#             "id": row[0],
#             "name": row[1],
#             "price": row[2],
#             "image": row[3],
#             "quantity": row[4],
#             "subtotal": subtotal
#         })

#     return jsonify({"items": cart_items, "total": total})


# # ➕ Increase Quantity

# @cart_bp.route('/cart/increase/<int:id>', methods=['PUT'])
# def increase_quantity(id):
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=?", (id,))
    
#     conn.commit()
#     conn.close()

#     return {"message": "Quantity increased"}

# # ➖ Decrease Quantity

# @cart_bp.route('/cart/decrease/<int:id>', methods=['PUT'])
# def decrease_quantity(id):
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("SELECT quantity FROM cart WHERE product_id=?", (id,))
#     qty = cursor.fetchone()

#     if qty and qty[0] > 1:
#         cursor.execute("UPDATE cart SET quantity = quantity - 1 WHERE product_id=?", (id,))
#     else:
#         cursor.execute("DELETE FROM cart WHERE product_id=?", (id,))

#     conn.commit()
#     conn.close()

#     return {"message": "Quantity decreased"}


# # ❌ Remove Item

# @cart_bp.route('/cart/remove/<int:id>', methods=['DELETE'])
# def remove_item(id):
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("DELETE FROM cart WHERE product_id=?", (id,))

#     conn.commit()
#     conn.close()

#     return {"message": "Item removed"}


# # 🧾 Place Order API

# @cart_bp.route('/cart/checkout', methods=['POST'])
# def checkout():
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     # Get cart items
#     cursor.execute("""
#     SELECT products.id, products.price, cart.quantity
#     FROM cart
#     JOIN products ON cart.product_id = products.id
#     """)
#     items = cursor.fetchall()

#     total_amount = 0

#     for item in items:
#         product_id = item[0]
#         price = item[1]
#         quantity = item[2]
#         total = price * quantity

#         total_amount += total

#         # Insert into orders
#         cursor.execute("""
#         INSERT INTO orders (product_id, quantity, price, total)
#         VALUES (?, ?, ?, ?)
#         """, (product_id, quantity, price, total))

#     # 🧹 Clear cart
#     cursor.execute("DELETE FROM cart")

#     conn.commit()
#     conn.close()

#     return {"message": "Order placed successfully 🎉", "total": total_amount}

# # Get Order History API

# @cart_bp.route('/orders', methods=['GET'])
# def get_orders():
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("""
#     SELECT products.name, orders.quantity, orders.total
#     FROM orders
#     JOIN products ON orders.product_id = products.id
#     """)
#     rows = cursor.fetchall()

#     conn.close()

#     orders = []
#     for row in rows:
#         orders.append({
#             "name": row[0],
#             "quantity": row[1],
#             "total": row[2]
#         })

#     return {"orders": orders}


from flask import Blueprint, request, jsonify
from routes.auth import token_required
import sqlite3
import os

cart_bp = Blueprint('cart', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "../database.db")


@cart_bp.route('/cart', methods=['POST'])
@token_required
def add_to_cart():
    data       = request.json
    product_id = data.get("product_id")
    user_id    = request.user_id

    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    cur.execute("SELECT * FROM cart WHERE product_id=? AND user_id=?", (product_id, user_id))
    item = cur.fetchone()

    if item:
        cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=? AND user_id=?",
                    (product_id, user_id))
    else:
        cur.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)",
                    (user_id, product_id))

    conn.commit()
    conn.close()
    return jsonify({"message": "Added to cart"})


@cart_bp.route('/cart', methods=['GET'])
@token_required
def get_cart():
    user_id = request.user_id
    conn    = sqlite3.connect(db_path)
    cur     = conn.cursor()

    cur.execute("""
        SELECT products.id, products.name, products.price, products.image, cart.quantity
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (user_id,))

    rows  = cur.fetchall()
    conn.close()

    cart_items = []
    total = 0
    for row in rows:
        subtotal = row[2] * row[4]
        total   += subtotal
        cart_items.append({
            "id": row[0], "name": row[1], "price": row[2],
            "image": row[3], "quantity": row[4], "subtotal": subtotal
        })

    return jsonify({"items": cart_items, "total": total})


@cart_bp.route('/cart/increase/<int:id>', methods=['PUT'])
@token_required
def increase_quantity(id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=? AND user_id=?",
                (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity increased"})


@cart_bp.route('/cart/decrease/<int:id>', methods=['PUT'])
@token_required
def decrease_quantity(id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT quantity FROM cart WHERE product_id=? AND user_id=?",
                (id, request.user_id))
    qty = cur.fetchone()
    if qty and qty[0] > 1:
        cur.execute("UPDATE cart SET quantity = quantity - 1 WHERE product_id=? AND user_id=?",
                    (id, request.user_id))
    else:
        cur.execute("DELETE FROM cart WHERE product_id=? AND user_id=?",
                    (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity decreased"})


@cart_bp.route('/cart/remove/<int:id>', methods=['DELETE'])
@token_required
def remove_item(id):
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("DELETE FROM cart WHERE product_id=? AND user_id=?", (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Item removed"})


@cart_bp.route('/cart/checkout', methods=['POST'])
@token_required
def checkout():
    user_id = request.user_id
    conn    = sqlite3.connect(db_path)
    cur     = conn.cursor()

    cur.execute("""
        SELECT products.id, products.price, cart.quantity
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = ?
    """, (user_id,))
    items = cur.fetchall()

    if not items:
        conn.close()
        return jsonify({"error": "Cart is empty"}), 400

    total_amount = 0
    for item in items:
        product_id, price, quantity = item
        total = price * quantity
        total_amount += total
        cur.execute("""
            INSERT INTO orders (user_id, product_id, quantity, price, total)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, product_id, quantity, price, total))

    cur.execute("DELETE FROM cart WHERE user_id=?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Order placed successfully 🎉", "total": total_amount})


@cart_bp.route('/orders', methods=['GET'])
@token_required
def get_orders():
    user_id = request.user_id
    conn    = sqlite3.connect(db_path)
    cur     = conn.cursor()

    cur.execute("""
        SELECT products.name, orders.quantity, orders.total, orders.status, orders.created_at
        FROM orders
        JOIN products ON orders.product_id = products.id
        WHERE orders.user_id = ?
        ORDER BY orders.id DESC
    """, (user_id,))
    rows = cur.fetchall()
    conn.close()

    orders = [
        {"name": r[0], "quantity": r[1], "total": r[2], "status": r[3], "created_at": r[4]}
        for r in rows
    ]
    return jsonify({"orders": orders})