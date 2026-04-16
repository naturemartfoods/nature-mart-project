from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models import connect_db

cart_bp = Blueprint('cart', __name__)


@cart_bp.route('/cart', methods=['POST'])
@token_required
def add_to_cart():
    data       = request.json
    product_id = data.get("product_id")
    user_id    = request.user_id

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    conn = connect_db()
    cur  = conn.cursor()

    # ✅ Check product exists
    cur.execute("SELECT id, stock FROM products WHERE id=%s AND is_active=1", (product_id,))
    product = cur.fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    cur.execute("SELECT id, quantity FROM cart WHERE product_id=%s AND user_id=%s", (product_id, user_id))
    item = cur.fetchone()

    if item:
        cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=%s AND user_id=%s",
                    (product_id, user_id))
    else:
        cur.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, 1)",
                    (user_id, product_id))

    conn.commit()
    conn.close()
    return jsonify({"message": "Added to cart"}), 200


@cart_bp.route('/cart', methods=['GET'])
@token_required
def get_cart():
    user_id  = request.user_id
    host_url = request.host_url.rstrip("/")
    conn     = connect_db()
    cur      = conn.cursor()

    cur.execute("""
        SELECT
            products.id        AS product_id,
            products.name      AS name,
            products.price     AS price,
            products.image     AS image,
            cart.quantity      AS quantity
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = %s
    """, (user_id,))

    rows  = cur.fetchall()
    conn.close()

    cart_items = []
    total = 0
    for row in rows:
        raw_image = row[3] or ""
        if raw_image.startswith("http"):
            image_url = raw_image
        elif raw_image.strip():
            image_url = host_url + raw_image
        else:
            image_url = ""

        subtotal = row[2] * row[4]
        total   += subtotal
        cart_items.append({
            "id":         row[0],   # same as product_id for compatibility
            "product_id": row[0],
            "name":       row[1],
            "price":      row[2],
            "image":      image_url,
            "quantity":   row[4],
            "subtotal":   subtotal,
        })

    return jsonify({"items": cart_items, "total": total}), 200


@cart_bp.route('/cart/increase/<int:id>', methods=['PUT'])
@token_required
def increase_quantity(id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=%s AND user_id=%s",
                (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity increased"}), 200


@cart_bp.route('/cart/decrease/<int:id>', methods=['PUT'])
@token_required
def decrease_quantity(id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("SELECT quantity FROM cart WHERE product_id=%s AND user_id=%s",
                (id, request.user_id))
    qty = cur.fetchone()
    if qty and qty[0] > 1:
        cur.execute("UPDATE cart SET quantity = quantity - 1 WHERE product_id=%s AND user_id=%s",
                    (id, request.user_id))
    else:
        cur.execute("DELETE FROM cart WHERE product_id=%s AND user_id=%s",
                    (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity updated"}), 200


@cart_bp.route('/cart/remove/<int:id>', methods=['DELETE'])
@token_required
def remove_item(id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM cart WHERE product_id=%s AND user_id=%s", (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Item removed"}), 200


# ✅ NEW: Clear entire cart (called after order placed)
@cart_bp.route('/cart/clear', methods=['DELETE'])
@token_required
def clear_cart():
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM cart WHERE user_id = %s", (request.user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Cart cleared"}), 200


@cart_bp.route('/cart/checkout', methods=['POST'])
@token_required
def checkout():
    user_id = request.user_id
    data    = request.json or {}

    name           = data.get("name", "")
    phone          = data.get("phone", "")
    address        = data.get("address", "")
    payment_method = data.get("payment_method", "cod")

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT products.id, products.price, cart.quantity
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = %s
    """, (user_id,))
    items = cur.fetchall()

    if not items:
        conn.close()
        return jsonify({"message": "Cart is empty"}), 400

    total_amount = 0
    for product_id, price, quantity in items:
        total = price * quantity
        total_amount += total
        cur.execute("""
            INSERT INTO orders
              (user_id, product_id, quantity, price, total,
               name, phone, address, payment_method, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'placed')
        """, (user_id, product_id, quantity, price, total,
              name, phone, address, payment_method))

    cur.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Order placed successfully", "total": total_amount}), 200