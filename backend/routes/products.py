

# from flask import Blueprint, jsonify, request
# from models import connect_db

# products_bp = Blueprint('products', __name__)


# @products_bp.route('/products', methods=['GET'])
# def get_products():
#     try:
#         conn = connect_db()
#         cur  = conn.cursor()
#         cur.execute("SELECT id, name, price, description, image, stock, weight FROM products WHERE is_active = 1")
#         rows = cur.fetchall()
#         conn.close()

#         products = []
#         for row in rows:
#             products.append({
#                 "id":          row[0],
#                 "name":        row[1],
#                 "price":       row[2],
#                 "description": row[3],
#                 "image":       request.host_url.rstrip("/") + "/images/" + row[4] if row[4] else "",
#                 "stock":       row[5],
#                 "weight":      row[6],
#             })
#         return jsonify(products)

#     except Exception as e:
#         print("❌ Products fetch error:", e)
#         return jsonify({"error": "Failed to fetch products", "details": str(e)}), 500


from flask import Blueprint, jsonify, request
from models import connect_db

products_bp = Blueprint('products', __name__)

@products_bp.route('/products/seed', methods=['GET'])
def seed_products():
    """TEMPORARY: seed test products — remove after confirming DB works"""
    try:
        conn = connect_db()
        cur  = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM products")
        count = cur.fetchone()[0]

        if count == 0:
            sample_products = [
                ("Organic Honey",       299, "Pure raw honey",          "honey.jpg",     50, "500g"),
                ("Chia Seeds",          199, "Rich in omega-3",         "chia.jpg",      80, "250g"),
                ("Moringa Powder",      249, "Superfood green powder",  "moringa.jpg",   60, "200g"),
                ("Cold Press Coconut",  349, "100% virgin coconut oil", "coconut.jpg",   40, "500ml"),
            ]
            cur.executemany("""
                INSERT INTO products (name, price, description, image, stock, weight, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, 1)
            """, sample_products)
            conn.commit()
            conn.close()
            return jsonify({"message": f"Seeded {len(sample_products)} products"}), 201

        conn.close()
        return jsonify({"message": f"Already has {count} products, skipping seed"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@products_bp.route('/products', methods=['GET'])
def get_products():
    try:
        conn = connect_db()
        cur  = conn.cursor()

        # DEBUG: First check total products in table
        cur.execute("SELECT COUNT(*) FROM products")
        total = cur.fetchone()[0]
        print(f"[products] Total rows in DB: {total}")

        cur.execute("SELECT COUNT(*) FROM products WHERE is_active = 1")
        active = cur.fetchone()[0]
        print(f"[products] Active products: {active}")

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

            # Fix: avoid double /images/ prefix
            if raw_image.startswith("http"):
                image_url = raw_image
            elif raw_image.startswith("/images/"):
                image_url = host + raw_image          # already has /images/
            elif raw_image.strip():
                image_url = f"{host}/images/{raw_image}"  # just filename
            else:
                image_url = ""

            products.append({
                "id":          row[0],
                "name":        row[1],
                "price":       row[2],
                "description": row[3],
                "image":       image_url,
                "stock":       row[5],
                "weight":      row[6],
            })

        print(f"[products] Returning {len(products)} products")
        return jsonify(products)

    except Exception as e:
        print("❌ Products fetch error:", e)
        return jsonify({"error": "Failed to fetch products", "details": str(e)}), 500