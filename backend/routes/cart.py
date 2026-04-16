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

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("SELECT * FROM cart WHERE product_id=%s AND user_id=%s", (product_id, user_id))
    item = cur.fetchone()

    if item:
        cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=%s AND user_id=%s",
                    (product_id, user_id))
    else:
        cur.execute("INSERT INTO cart (user_id, product_id, quantity) VALUES (%s, %s, 1)",
                    (user_id, product_id))

    conn.commit()
    conn.close()
    return jsonify({"message": "Added to cart"})


@cart_bp.route('/cart', methods=['GET'])
@token_required
def get_cart():
    user_id  = request.user_id
    host_url = request.host_url.rstrip("/")  # ✅ e.g. https://nature-mart-project.onrender.com
    conn     = connect_db()
    cur      = conn.cursor()

    cur.execute("""
        SELECT
            products.id        AS id,
            products.name      AS name,
            products.price     AS price,
            products.image     AS image,
            cart.quantity      AS quantity,
            products.id        AS product_id
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
        # ✅ FIXED: if image is already a full URL, use as-is
        # if it's a path like /images/apple.jpg, prepend host_url
        if raw_image.startswith("http"):
            image_url = raw_image
        elif raw_image:
            image_url = host_url + raw_image
        else:
            image_url = ""

        subtotal = row[2] * row[4]
        total   += subtotal
        cart_items.append({
            "id":         row[0],
            "name":       row[1],
            "price":      row[2],
            "image":      image_url,   # ✅ always a full URL now
            "quantity":   row[4],
            "product_id": row[5],
            "subtotal":   subtotal,
        })

    return jsonify({"items": cart_items, "total": total})


@cart_bp.route('/cart/increase/<int:id>', methods=['PUT'])
@token_required
def increase_quantity(id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("UPDATE cart SET quantity = quantity + 1 WHERE product_id=%s AND user_id=%s",
                (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Quantity increased"})


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
    return jsonify({"message": "Quantity decreased"})


@cart_bp.route('/cart/remove/<int:id>', methods=['DELETE'])
@token_required
def remove_item(id):
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("DELETE FROM cart WHERE product_id=%s AND user_id=%s", (id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({"message": "Item removed"})


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

    return jsonify({"message": "Order placed successfully", "total": total_amount})