from flask import Blueprint, request, jsonify
import sqlite3
import os

cart_bp = Blueprint('cart', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "../database.db")
print("CART DB:", db_path)

# Add to cart
@cart_bp.route('/cart', methods=['POST'])
def add_to_cart():
    data = request.json
    product_id = data.get("product_id")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM cart WHERE product_id=?", (product_id,))
    item = cursor.fetchone()

    if item:
        cursor.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=?", (product_id,))
    else:
        cursor.execute("INSERT INTO cart (product_id, quantity) VALUES (?, 1)", (product_id,))

    conn.commit()
    conn.close()

    return {"message": "Added to cart"}




# Get cart
@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    SELECT products.id, products.name, products.price, products.image, cart.quantity
    FROM cart
    JOIN products ON cart.product_id = products.id
    """)

    rows = cursor.fetchall()
    conn.close()

    cart_items = []
    total = 0

    for row in rows:
        subtotal = row[2] * row[4]
        total += subtotal

        cart_items.append({
            "id": row[0],
            "name": row[1],
            "price": row[2],
            "image": row[3],
            "quantity": row[4],
            "subtotal": subtotal
        })

    return jsonify({"items": cart_items, "total": total})


# ➕ Increase Quantity

@cart_bp.route('/cart/increase/<int:id>', methods=['PUT'])
def increase_quantity(id):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=?", (id,))
    
    conn.commit()
    conn.close()

    return {"message": "Quantity increased"}

# ➖ Decrease Quantity

@cart_bp.route('/cart/decrease/<int:id>', methods=['PUT'])
def decrease_quantity(id):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT quantity FROM cart WHERE product_id=?", (id,))
    qty = cursor.fetchone()

    if qty and qty[0] > 1:
        cursor.execute("UPDATE cart SET quantity = quantity - 1 WHERE product_id=?", (id,))
    else:
        cursor.execute("DELETE FROM cart WHERE product_id=?", (id,))

    conn.commit()
    conn.close()

    return {"message": "Quantity decreased"}


# ❌ Remove Item

@cart_bp.route('/cart/remove/<int:id>', methods=['DELETE'])
def remove_item(id):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("DELETE FROM cart WHERE product_id=?", (id,))

    conn.commit()
    conn.close()

    return {"message": "Item removed"}


# 🧾 Place Order API

@cart_bp.route('/cart/checkout', methods=['POST'])
def checkout():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get cart items
    cursor.execute("""
    SELECT products.id, products.price, cart.quantity
    FROM cart
    JOIN products ON cart.product_id = products.id
    """)
    items = cursor.fetchall()

    total_amount = 0

    for item in items:
        product_id = item[0]
        price = item[1]
        quantity = item[2]
        total = price * quantity

        total_amount += total

        # Insert into orders
        cursor.execute("""
        INSERT INTO orders (product_id, quantity, price, total)
        VALUES (?, ?, ?, ?)
        """, (product_id, quantity, price, total))

    # 🧹 Clear cart
    cursor.execute("DELETE FROM cart")

    conn.commit()
    conn.close()

    return {"message": "Order placed successfully 🎉", "total": total_amount}

# Get Order History API

@cart_bp.route('/orders', methods=['GET'])
def get_orders():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("""
    SELECT products.name, orders.quantity, orders.total
    FROM orders
    JOIN products ON orders.product_id = products.id
    """)
    rows = cursor.fetchall()

    conn.close()

    orders = []
    for row in rows:
        orders.append({
            "name": row[0],
            "quantity": row[1],
            "total": row[2]
        })

    return {"orders": orders}