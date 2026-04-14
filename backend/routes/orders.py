from flask import Blueprint, jsonify, request
from routes.auth import token_required
from models import connect_db

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/orders', methods=['GET'])
@token_required
def get_orders():
    user_id = request.user_id

    conn = connect_db()
    cur  = conn.cursor()

    cur.execute("""
        SELECT
            products.name,
            orders.quantity,
            orders.total,
            orders.address,
            orders.payment_method,
            orders.status
        FROM orders
        JOIN products ON orders.product_id = products.id
        WHERE orders.user_id = %s
        ORDER BY orders.id DESC
    """, (user_id,))

    rows = cur.fetchall()
    conn.close()

    orders = []
    for row in rows:
        orders.append({
            "product_name":   row[0],
            "quantity":       row[1],
            "total":          row[2],
            "address":        row[3] or "",
            "payment_method": row[4] or "cod",
            "status":         row[5] or "placed",
        })

    return jsonify({"orders": orders})