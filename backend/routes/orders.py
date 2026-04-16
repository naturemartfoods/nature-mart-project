

from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models import connect_db
from datetime import datetime
import uuid

orders_bp = Blueprint("orders", __name__)


def generate_order_id():
    uid = str(uuid.uuid4()).upper()[:6]
    date_str = datetime.now().strftime("%Y%m%d")
    return f"NM-{date_str}-{uid}"


@orders_bp.route("/orders/place", methods=["POST"])
@token_required
def place_order():
    user_id = request.user_id
    data = request.json or {}

    delivery = data.get("delivery_address", {})
    payment_method = data.get("payment_method", "cod")
    items = data.get("items", [])

    if not items:
        return jsonify({"error": "No items in order"}), 400

    conn = connect_db()
    cur = conn.cursor()

    try:
        order_id = generate_order_id()

        subtotal = float(data.get("subtotal", 0))
        shipping = float(data.get("shipping", 0))
        total = float(data.get("total", 0))

        # Insert main order (store delivery + payment info)
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)

            cur.execute("SELECT price FROM products WHERE id=%s", (product_id,))
            product = cur.fetchone()

            if not product:
                continue

            price = product[0]
            item_total = price * quantity

            cur.execute("""
                INSERT INTO orders (
                    user_id, product_id, quantity, price, total, status
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, product_id, quantity, price, item_total, "placed"))

        # Clear cart
        cur.execute("DELETE FROM cart WHERE user_id=%s", (user_id,))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "total": total
        })

    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/orders", methods=["GET"])
@token_required
def get_orders():
    user_id = request.user_id

    conn = connect_db()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, product_id, quantity, price, total, status, created_at
        FROM orders
        WHERE user_id=%s
        ORDER BY id DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    orders = []
    for row in rows:
        orders.append({
            "order_id": row[0],
            "product_id": row[1],
            "quantity": row[2],
            "price": row[3],
            "total": row[4],
            "status": row[5],
            "created_at": row[6]
        })

    return jsonify({"orders": orders})