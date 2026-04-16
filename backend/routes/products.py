

from flask import Blueprint, jsonify, request
from models import connect_db

products_bp = Blueprint('products', __name__)


@products_bp.route('/products', methods=['GET'])
def get_products():
    conn   = connect_db()
    cur    = conn.cursor()
    cur.execute("SELECT id, name, price, description, image, stock, weight FROM products WHERE is_active=1")
    rows   = cur.fetchall()
    conn.close()

    products = []
    for row in rows:
        products.append({
            "id":          row[0],
            "name":        row[1],
            "price":       row[2],
            "description": row[3],
            "image":       request.host_url.rstrip("/") + row[4] if row[4] else "",
            "stock":       row[5],
            "weight":      row[6],
        })

    return jsonify(products)