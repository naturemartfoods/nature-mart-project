# from flask import Blueprint, request, jsonify
# from routes.auth import token_required
# from models import connect_db

# cart_bp = Blueprint('cart', __name__)

# BASE_URL = "https://nature-mart-project.onrender.com"


# def build_image_url(raw_image):
#     if not raw_image:
#         return ""
#     first_image = raw_image.split(",")[0].strip()
#     if first_image.startswith("http"):
#         if "/images/" not in first_image:
#             filename = first_image.split("com")[-1].lstrip("/")
#             return f"{BASE_URL}/images/{filename}"
#         return first_image
#     elif first_image.startswith("/images/"):
#         return BASE_URL + first_image
#     else:
#         return f"{BASE_URL}/images/{first_image}"


# @cart_bp.route('/cart', methods=['POST'])
# @token_required
# def add_to_cart():
#     data       = request.json
#     product_id = data.get("product_id")
#     weight     = data.get("weight", "250g")
#     user_id    = request.user_id

#     if not product_id:
#         return jsonify({"error": "product_id is required"}), 400

#     conn = connect_db()
#     cur  = conn.cursor()

#     cur.execute("SELECT id FROM products WHERE id=%s AND is_active=1", (product_id,))
#     product = cur.fetchone()
#     if not product:
#         conn.close()
#         return jsonify({"error": "Product not found"}), 404

#     # Each product+weight combo is a separate cart row
#     cur.execute(
#         "SELECT id, quantity FROM cart WHERE product_id=%s AND user_id=%s AND weight=%s",
#         (product_id, user_id, weight)
#     )
#     item = cur.fetchone()

#     if item:
#         cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE id=%s", (item[0],))
#     else:
#         cur.execute(
#             "INSERT INTO cart (user_id, product_id, quantity, weight) VALUES (%s, %s, 1, %s)",
#             (user_id, product_id, weight)
#         )

#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Added to cart"}), 200


# @cart_bp.route('/cart', methods=['GET'])
# @token_required
# def get_cart():
#     user_id = request.user_id
#     conn    = connect_db()
#     cur     = conn.cursor()

#     cur.execute("""
#         SELECT
#             cart.id            AS cart_id,
#             products.id        AS product_id,
#             products.name      AS name,
#             products.image     AS image,
#             cart.quantity      AS quantity,
#             cart.weight        AS weight,
#             products.price_250g,
#             products.price_500g,
#             products.price_1kg
#         FROM cart
#         JOIN products ON cart.product_id = products.id
#         WHERE cart.user_id = %s
#         ORDER BY cart.id
#     """, (user_id,))

#     rows = cur.fetchall()
#     conn.close()

#     cart_items = []
#     total = 0
#     for row in rows:
#         cart_id, product_id, name, image, quantity, weight, p250, p500, p1kg = row

#         price_map = {"250g": p250, "500g": p500, "1kg": p1kg}
#         price = price_map.get(weight) or p250 or 0

#         image_url = build_image_url(image or "")
#         subtotal  = float(price) * quantity
#         total    += subtotal

#         cart_items.append({
#             "cart_id":    cart_id,      # ✅ unique row id
#             "product_id": product_id,
#             "name":       name,
#             "price":      float(price),
#             "image":      image_url,
#             "quantity":   quantity,
#             "weight":     weight,
#             "subtotal":   subtotal,
#         })

#     return jsonify({"items": cart_items, "total": total}), 200


# # ✅ Now uses cart_id — so each weight row is updated independently
# @cart_bp.route('/cart/increase/<int:cart_id>', methods=['PUT'])
# @token_required
# def increase_quantity(cart_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute(
#         "UPDATE cart SET quantity = quantity + 1 WHERE id=%s AND user_id=%s",
#         (cart_id, request.user_id)
#     )
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Quantity increased"}), 200


# @cart_bp.route('/cart/decrease/<int:cart_id>', methods=['PUT'])
# @token_required
# def decrease_quantity(cart_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute(
#         "SELECT quantity FROM cart WHERE id=%s AND user_id=%s",
#         (cart_id, request.user_id)
#     )
#     qty = cur.fetchone()
#     if qty and qty[0] > 1:
#         cur.execute(
#             "UPDATE cart SET quantity = quantity - 1 WHERE id=%s AND user_id=%s",
#             (cart_id, request.user_id)
#         )
#     else:
#         cur.execute(
#             "DELETE FROM cart WHERE id=%s AND user_id=%s",
#             (cart_id, request.user_id)
#         )
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Quantity updated"}), 200


# @cart_bp.route('/cart/remove/<int:cart_id>', methods=['DELETE'])
# @token_required
# def remove_item(cart_id):
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute(
#         "DELETE FROM cart WHERE id=%s AND user_id=%s",
#         (cart_id, request.user_id)
#     )
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Item removed"}), 200


# @cart_bp.route('/cart/clear', methods=['DELETE'])
# @token_required
# def clear_cart():
#     conn = connect_db()
#     cur  = conn.cursor()
#     cur.execute("DELETE FROM cart WHERE user_id = %s", (request.user_id,))
#     conn.commit()
#     conn.close()
#     return jsonify({"message": "Cart cleared"}), 200


# @cart_bp.route('/cart/checkout', methods=['POST'])
# @token_required
# def checkout():
#     user_id = request.user_id
#     data    = request.json or {}

#     name           = data.get("name", "")
#     phone          = data.get("phone", "")
#     address        = data.get("address", "")
#     payment_method = data.get("payment_method", "cod")

#     conn = connect_db()
#     cur  = conn.cursor()

#     cur.execute("""
#         SELECT products.id, cart.weight, cart.quantity,
#                products.price_250g, products.price_500g, products.price_1kg
#         FROM cart
#         JOIN products ON cart.product_id = products.id
#         WHERE cart.user_id = %s
#     """, (user_id,))
#     items = cur.fetchall()

#     if not items:
#         conn.close()
#         return jsonify({"message": "Cart is empty"}), 400

#     total_amount = 0
#     for product_id, weight, quantity, p250, p500, p1kg in items:
#         price_map = {"250g": p250, "500g": p500, "1kg": p1kg}
#         price = price_map.get(weight) or p250 or 0
#         total = float(price) * quantity
#         total_amount += total

#         cur.execute("""
#             INSERT INTO orders
#               (user_id, product_id, quantity, price, total,
#                name, phone, address, payment_method, status)
#             VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'placed')
#         """, (user_id, product_id, quantity, price, total,
#               name, phone, address, payment_method))

#     cur.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))
#     conn.commit()
#     conn.close()

#     return jsonify({"message": "Order placed successfully", "total": total_amount}), 200

from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models import connect_db

cart_bp = Blueprint('cart', __name__)

BASE_URL = "https://nature-mart-project.onrender.com"


def build_image_url(raw_image):
    if not raw_image:
        return ""
    first_image = raw_image.split(",")[0].strip()
    if first_image.startswith("http"):
        return first_image


@cart_bp.route('/cart', methods=['POST'])
@token_required
def add_to_cart():
    data       = request.json
    product_id = data.get("product_id")
    weight     = data.get("weight", "250g")
    user_id    = request.user_id

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("SELECT id FROM products WHERE id=%s AND is_active=1", (product_id,))
    product = cur.fetchone()
    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    # Each product+weight combo is a separate cart row
    cur.execute(
        "SELECT id, quantity FROM cart WHERE product_id=%s AND user_id=%s AND weight=%s",
        (product_id, user_id, weight)
    )
    item = cur.fetchone()

    if item:
        cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE id=%s", (item[0],))
    else:
        cur.execute(
            "INSERT INTO cart (user_id, product_id, quantity, weight) VALUES (%s, %s, 1, %s)",
            (user_id, product_id, weight)
        )

    conn.commit()
    conn.close()
    return jsonify({"message": "Added to cart"}), 200


@cart_bp.route('/cart', methods=['GET'])
@token_required
def get_cart():
    user_id = request.user_id
    conn    = connect_db()
    cur     = conn.cursor()

    cur.execute("""
        SELECT
            cart.id            AS cart_id,
            products.id        AS product_id,
            products.name      AS name,
            products.image     AS image,
            cart.quantity      AS quantity,
            cart.weight        AS weight,
            products.price_250g,
            products.price_500g,
            products.price_1kg
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = %s
        ORDER BY cart.id
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    cart_items = []
    total = 0
    for row in rows:
        cart_id, product_id, name, image, quantity, weight, p250, p500, p1kg = row

        price_map = {"250g": p250, "500g": p500, "1kg": p1kg}
        price = price_map.get(weight) or p250 or 0

        image_url = build_image_url(image or "")
        subtotal  = float(price) * quantity
        total    += subtotal

        cart_items.append({
            "cart_id":    cart_id,      # ✅ unique row id
            "product_id": product_id,
            "name":       name,
            "price":      float(price),
            "image":      image_url,
            "quantity":   quantity,
            "weight":     weight,
            "subtotal":   subtotal,
        })

    return jsonify({"items": cart_items, "total": total}), 200


# ✅ Now uses cart_id — so each weight row is updated independently
@cart_bp.route('/cart/increase/<int:cart_id>', methods=['PUT'])
@token_required
def increase_quantity(cart_id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE cart SET quantity = quantity + 1 WHERE id=%s AND user_id=%s",
        (cart_id, request.user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity increased"}), 200


@cart_bp.route('/cart/decrease/<int:cart_id>', methods=['PUT'])
@token_required
def decrease_quantity(cart_id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute(
        "SELECT quantity FROM cart WHERE id=%s AND user_id=%s",
        (cart_id, request.user_id)
    )
    qty = cur.fetchone()
    if qty and qty[0] > 1:
        cur.execute(
            "UPDATE cart SET quantity = quantity - 1 WHERE id=%s AND user_id=%s",
            (cart_id, request.user_id)
        )
    else:
        cur.execute(
            "DELETE FROM cart WHERE id=%s AND user_id=%s",
            (cart_id, request.user_id)
        )
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity updated"}), 200


@cart_bp.route('/cart/remove/<int:cart_id>', methods=['DELETE'])
@token_required
def remove_item(cart_id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute(
        "DELETE FROM cart WHERE id=%s AND user_id=%s",
        (cart_id, request.user_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"message": "Item removed"}), 200


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
        SELECT products.id, cart.weight, cart.quantity,
               products.price_250g, products.price_500g, products.price_1kg
        FROM cart
        JOIN products ON cart.product_id = products.id
        WHERE cart.user_id = %s
    """, (user_id,))
    items = cur.fetchall()

    if not items:
        conn.close()
        return jsonify({"message": "Cart is empty"}), 400

    total_amount = 0
    for product_id, weight, quantity, p250, p500, p1kg in items:
        price_map = {"250g": p250, "500g": p500, "1kg": p1kg}
        price = price_map.get(weight) or p250 or 0
        total = float(price) * quantity
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