from flask import Blueprint, jsonify, request
from models import connect_db

products_bp = Blueprint('products', __name__)


@products_bp.route('/products', methods=['GET'])
def get_products():
    try:
        conn = connect_db()
        cur  = conn.cursor()

        cur.execute("""
            SELECT id, name, price, description, image, stock, weight
            FROM products
            WHERE is_active = 1
        """)
        rows = cur.fetchall()
        conn.close()

        host = request.host_url.rstrip("/")
        products = []

        for row in rows:
            raw_image = row[4] or ""
            
            if raw_image.startswith("http"):
                image_url = raw_image
            else:
                # raw_image is just "chia.jpg" now
                image_url = f"{host}/images/{raw_image}" if raw_image else ""

            products.append({
                "id":          row[0],
                "name":        row[1],
                "price":       row[2],
                "description": row[3],
                "image":       image_url,
                "stock":       row[5],
                "weight":      row[6],
            })

        return jsonify(products)

    except Exception as e:
        print("❌ Products fetch error:", e)
        return jsonify({"error": "Failed to fetch products", "details": str(e)}), 500