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

    # ── Validate inputs ───────────────────────────────────────────────────────
    if not items:
        return jsonify({"error": "No items in order"}), 400

    if not delivery or not delivery.get("address_line"):
        return jsonify({"error": "Delivery address is required"}), 400

    if payment_method not in ("cod", "upi", "card"):
        return jsonify({"error": "Invalid payment method"}), 400

    # ── Flatten address for storage ───────────────────────────────────────────
    delivery_name    = delivery.get("full_name", "")
    delivery_phone   = delivery.get("phone", "")
    delivery_address = (
        f"{delivery.get('address_line', '')}, "
        f"{delivery.get('city', '')}, "
        f"{delivery.get('state', '')} - "
        f"{delivery.get('pincode', '')}"
    )

    conn = connect_db()
    cur  = conn.cursor()

    try:
        order_id = generate_order_id()

        subtotal = float(data.get("subtotal", 0))
        shipping = float(data.get("shipping", 0))
        total    = float(data.get("total", 0))

        inserted = 0  # track how many items were actually inserted

        for item in items:
            product_id = item.get("product_id")
            quantity   = int(item.get("quantity", 1))

            if not product_id or quantity < 1:
                continue

            # ── Fetch live price from DB (never trust client price) ───────────
            cur.execute("SELECT price, stock FROM products WHERE id = %s AND is_active = 1", (product_id,))
            product = cur.fetchone()

            if not product:
                conn.rollback()
                conn.close()
                return jsonify({"error": f"Product {product_id} not found or unavailable"}), 400

            price = float(product[0])
            stock = product[1]

            if stock < quantity:
                conn.rollback()
                conn.close()
                return jsonify({"error": f"Insufficient stock for product {product_id}"}), 400

            item_total = price * quantity

            # ── Insert order row (with delivery + payment info) ───────────────
            cur.execute("""
                INSERT INTO orders (
                    order_id, user_id, product_id, quantity,
                    price, total,
                    name, phone, address,
                    payment_method, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id,
                user_id,
                product_id,
                quantity,
                price,
                item_total,
                delivery_name,
                delivery_phone,
                delivery_address,
                payment_method,
                "placed",
            ))

            # ── Decrement stock ───────────────────────────────────────────────
            cur.execute(
                "UPDATE products SET stock = stock - %s WHERE id = %s",
                (quantity, product_id)
            )

            inserted += 1

        if inserted == 0:
            conn.rollback()
            conn.close()
            return jsonify({"error": "No valid items could be processed"}), 400

        # ── Clear user's cart ─────────────────────────────────────────────────
        cur.execute("DELETE FROM cart WHERE user_id = %s", (user_id,))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "total": total,
            "payment_method": payment_method,
            "items_count": inserted,
        }), 201

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[place_order] Error: {e}")
        return jsonify({"error": "Failed to place order. Please try again."}), 500


@orders_bp.route("/orders", methods=["GET"])
@token_required
def get_orders():
    user_id = request.user_id

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT order_id, product_id, quantity, price, total,
               name, phone, address, payment_method, status, created_at
        FROM orders
        WHERE user_id = %s
        ORDER BY id DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    # Group rows by order_id so each order groups its items
    from collections import defaultdict
    grouped = defaultdict(lambda: {
        "order_id": None, "items": [], "total": 0,
        "name": "", "phone": "", "address": "",
        "payment_method": "", "status": "", "created_at": ""
    })

    for row in rows:
        oid = row[0]
        grouped[oid]["order_id"]       = oid
        grouped[oid]["name"]           = row[5]
        grouped[oid]["phone"]          = row[6]
        grouped[oid]["address"]        = row[7]
        grouped[oid]["payment_method"] = row[8]
        grouped[oid]["status"]         = row[9]
        grouped[oid]["created_at"]     = str(row[10])
        grouped[oid]["total"]         += float(row[4] or 0)
        grouped[oid]["items"].append({
            "product_id": row[1],
            "quantity":   row[2],
            "price":      float(row[3] or 0),
            "item_total": float(row[4] or 0),
        })

    return jsonify({"orders": list(grouped.values())})