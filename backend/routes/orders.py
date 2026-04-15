# from flask import Blueprint, request, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
# from models import db, Order, OrderItem, CartItem, Product
# from datetime import datetime
# import uuid

# orders_bp = Blueprint("orders", __name__)


# def generate_order_id():
#     """Generate a short readable order ID like NM-20240415-XXXX"""
#     uid = str(uuid.uuid4()).upper()[:6]
#     date_str = datetime.now().strftime("%Y%m%d")
#     return f"NM-{date_str}-{uid}"


# @orders_bp.route("/orders/place", methods=["POST"])
# @jwt_required()
# def place_order():
#     """
#     Place a new order.
#     Body:
#       {
#         "delivery_address": {
#           "full_name": str,
#           "phone": str,
#           "address_line": str,
#           "city": str,
#           "state": str,
#           "pincode": str
#         },
#         "payment_method": "cod" | "upi" | "card",
#         "items": [ { "product_id": int, "quantity": int, "price": float, "name": str } ],
#         "subtotal": float,
#         "shipping": float,
#         "total": float
#       }
#     """
#     user_id = get_jwt_identity()
#     data = request.get_json()

#     # ── Validate required fields ──────────────────────────────────────────────
#     delivery = data.get("delivery_address", {})
#     required_addr = ["full_name", "phone", "address_line", "city", "state", "pincode"]
#     for field in required_addr:
#         if not delivery.get(field, "").strip():
#             return jsonify({"error": f"Missing delivery field: {field}"}), 400

#     payment_method = data.get("payment_method", "")
#     if payment_method not in ["cod", "upi", "card"]:
#         return jsonify({"error": "Invalid payment method"}), 400

#     items = data.get("items", [])
#     if not items:
#         return jsonify({"error": "No items in order"}), 400

#     try:
#         # ── Create Order ──────────────────────────────────────────────────────
#         order_id = generate_order_id()

#         new_order = Order(
#             order_id=order_id,
#             user_id=user_id,
#             full_name=delivery["full_name"].strip(),
#             phone=delivery["phone"].strip(),
#             address_line=delivery["address_line"].strip(),
#             city=delivery["city"].strip(),
#             state=delivery["state"].strip(),
#             pincode=delivery["pincode"].strip(),
#             payment_method=payment_method,
#             payment_status="paid" if payment_method in ["upi", "card"] else "pending",
#             order_status="confirmed",
#             subtotal=float(data.get("subtotal", 0)),
#             shipping=float(data.get("shipping", 0)),
#             total=float(data.get("total", 0)),
#             created_at=datetime.utcnow(),
#         )
#         db.session.add(new_order)

#         # ── Add Order Items ───────────────────────────────────────────────────
#         for item in items:
#             product_id = item.get("product_id")
#             quantity = int(item.get("quantity", 1))
#             price = float(item.get("price", 0))

#             # Decrease product stock
#             product = Product.query.get(product_id)
#             if product:
#                 if product.stock < quantity:
#                     db.session.rollback()
#                     return jsonify({"error": f"Insufficient stock for {product.name}"}), 400
#                 product.stock -= quantity

#             order_item = OrderItem(
#                 order_id=order_id,
#                 product_id=product_id,
#                 product_name=item.get("name", ""),
#                 quantity=quantity,
#                 unit_price=price,
#                 total_price=price * quantity,
#             )
#             db.session.add(order_item)

#         # ── Clear Cart ────────────────────────────────────────────────────────
#         CartItem.query.filter_by(user_id=user_id).delete()

#         db.session.commit()

#         return jsonify({
#             "message": "Order placed successfully",
#             "order_id": order_id,
#             "payment_status": new_order.payment_status,
#             "order_status": new_order.order_status,
#         }), 201

#     except Exception as e:
#         db.session.rollback()
#         return jsonify({"error": str(e)}), 500


# @orders_bp.route("/orders", methods=["GET"])
# @jwt_required()
# def get_user_orders():
#     """Get all orders for the logged-in user."""
#     user_id = get_jwt_identity()
#     orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()

#     result = []
#     for order in orders:
#         result.append({
#             "order_id": order.order_id,
#             "order_status": order.order_status,
#             "payment_method": order.payment_method,
#             "payment_status": order.payment_status,
#             "total": order.total,
#             "created_at": order.created_at.strftime("%d %b %Y, %I:%M %p"),
#             "items": [
#                 {
#                     "product_id": i.product_id,
#                     "product_name": i.product_name,
#                     "quantity": i.quantity,
#                     "unit_price": i.unit_price,
#                     "total_price": i.total_price,
#                 }
#                 for i in order.items
#             ],
#             "delivery": {
#                 "full_name": order.full_name,
#                 "phone": order.phone,
#                 "address_line": order.address_line,
#                 "city": order.city,
#                 "state": order.state,
#                 "pincode": order.pincode,
#             },
#         })

#     return jsonify({"orders": result}), 200


# @orders_bp.route("/orders/<order_id>", methods=["GET"])
# @jwt_required()
# def get_order_detail(order_id):
#     """Get a single order by ID."""
#     user_id = get_jwt_identity()
#     order = Order.query.filter_by(order_id=order_id, user_id=user_id).first()
#     if not order:
#         return jsonify({"error": "Order not found"}), 404

#     return jsonify({
#         "order_id": order.order_id,
#         "order_status": order.order_status,
#         "payment_method": order.payment_method,
#         "payment_status": order.payment_status,
#         "subtotal": order.subtotal,
#         "shipping": order.shipping,
#         "total": order.total,
#         "created_at": order.created_at.strftime("%d %b %Y, %I:%M %p"),
#         "items": [
#             {
#                 "product_id": i.product_id,
#                 "product_name": i.product_name,
#                 "quantity": i.quantity,
#                 "unit_price": i.unit_price,
#                 "total_price": i.total_price,
#             }
#             for i in order.items
#         ],
#         "delivery": {
#             "full_name": order.full_name,
#             "phone": order.phone,
#             "address_line": order.address_line,
#             "city": order.city,
#             "state": order.state,
#             "pincode": order.pincode,
#         },
#     }), 200

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