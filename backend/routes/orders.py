from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models import connect_db
from datetime import datetime
import uuid

orders_bp = Blueprint("orders", __name__)


def generate_order_id():
    """Generate a human-readable unique order ID like NM-20250417-A1B2C3"""
    uid      = str(uuid.uuid4()).upper()[:6]
    date_str = datetime.now().strftime("%Y%m%d")
    return f"NM-{date_str}-{uid}"


# ─────────────────────────────────────────────────────────────────────────────
#  POST /api/orders/place
# ─────────────────────────────────────────────────────────────────────────────
@orders_bp.route("/orders/place", methods=["POST"])
@token_required
def place_order():
    user_id = request.user_id
    data    = request.json or {}

    delivery       = data.get("delivery_address", {})
    payment_method = data.get("payment_method", "cod")
    items          = data.get("items", [])

    # ── Validate inputs ───────────────────────────────────────────────────────
    if not items:
        return jsonify({"error": "No items in order"}), 400

    if not delivery or not delivery.get("address_line", "").strip():
        return jsonify({"error": "Delivery address is required"}), 400

    if payment_method not in ("cod", "upi", "card"):
        return jsonify({"error": "Invalid payment method"}), 400

    # ── Flatten address ───────────────────────────────────────────────────────
    delivery_name    = delivery.get("full_name", "").strip()
    delivery_phone   = delivery.get("phone", "").strip()
    delivery_address = (
        f"{delivery.get('address_line', '').strip()}, "
        f"{delivery.get('city', '').strip()}, "
        f"{delivery.get('state', '').strip()} - "
        f"{delivery.get('pincode', '').strip()}"
    )

    conn = connect_db()
    cur  = conn.cursor()

    try:
        order_id = generate_order_id()
        total    = float(data.get("total", 0))
        inserted = 0

        for item in items:
            product_id = item.get("product_id") or item.get("id")
            quantity   = int(item.get("quantity", 1))

            if not product_id or quantity < 1:
                continue

            # ── Fetch live price & stock (never trust client price) ───────────
            cur.execute(
                "SELECT price, stock FROM products WHERE id = %s AND is_active = 1",
                (product_id,)
            )
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

            # ── Insert order row ──────────────────────────────────────────────
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
            "message":        "Order placed successfully",
            "order_id":       order_id,
            "total":          total,
            "payment_method": payment_method,
            "items_count":    inserted,
        }), 201

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[place_order] Error: {e}")
        return jsonify({"error": "Failed to place order. Please try again."}), 500


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/orders  — returns orders grouped by order_id, with product names
# ─────────────────────────────────────────────────────────────────────────────
@orders_bp.route("/orders", methods=["GET"])
@token_required
def get_orders():
    user_id = request.user_id

    conn = connect_db()
    cur  = conn.cursor()

    # Join products so we get the product name in each row
    cur.execute("""
        SELECT
            o.order_id,
            o.product_id,
            p.name        AS product_name,
            o.quantity,
            o.price,
            o.total,
            o.name        AS delivery_name,
            o.phone,
            o.address,
            o.payment_method,
            o.status,
            o.created_at
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.user_id = %s
        ORDER BY o.id DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    from collections import defaultdict

    grouped = defaultdict(lambda: {
        "order_id":       None,
        "items":          [],
        "grand_total":    0,
        "name":           "",
        "phone":          "",
        "address":        "",
        "payment_method": "",
        "status":         "",
        "created_at":     "",
    })

    for row in rows:
        oid = row[0] or f"LEGACY-{row[1]}"   # fallback for old rows without order_id
        g   = grouped[oid]

        if g["order_id"] is None:
            g["order_id"]       = oid
            g["name"]           = row[6] or ""
            g["phone"]          = row[7] or ""
            g["address"]        = row[8] or ""
            g["payment_method"] = row[9] or "cod"
            g["status"]         = row[10] or "placed"
            g["created_at"]     = str(row[11] or "")

        g["grand_total"] += float(row[5] or 0)
        g["items"].append({
            "product_id":   row[1],
            "product_name": row[2] or "Unknown Product",
            "quantity":     row[3],
            "price":        float(row[4] or 0),
            "item_total":   float(row[5] or 0),
        })

    # Most recent orders first
    result = sorted(grouped.values(), key=lambda o: o["created_at"], reverse=True)
    return jsonify({"orders": result})


# ─────────────────────────────────────────────────────────────────────────────
#  GET /api/orders/<order_id>  — single order detail
# ─────────────────────────────────────────────────────────────────────────────
@orders_bp.route("/orders/<string:order_id>", methods=["GET"])
@token_required
def get_order_detail(order_id):
    user_id = request.user_id

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            o.order_id, o.product_id, p.name AS product_name,
            o.quantity, o.price, o.total,
            o.name, o.phone, o.address,
            o.payment_method, o.status, o.created_at
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.order_id = %s AND o.user_id = %s
    """, (order_id, user_id))

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return jsonify({"error": "Order not found"}), 404

    order = {
        "order_id":       rows[0][0],
        "name":           rows[0][6],
        "phone":          rows[0][7],
        "address":        rows[0][8],
        "payment_method": rows[0][9],
        "status":         rows[0][10],
        "created_at":     str(rows[0][11]),
        "grand_total":    0,
        "items":          [],
    }
    for row in rows:
        order["grand_total"] += float(row[5] or 0)
        order["items"].append({
            "product_id":   row[1],
            "product_name": row[2] or "Unknown Product",
            "quantity":     row[3],
            "price":        float(row[4] or 0),
            "item_total":   float(row[5] or 0),
        })

    return jsonify({"order": order})