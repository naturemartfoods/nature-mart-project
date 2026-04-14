# # from flask import Blueprint, jsonify
# # import sqlite3
# # import os

# # products_bp = Blueprint('products', __name__)

# # BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# # db_path = os.path.join(BASE_DIR, "../database.db")
# # print("PRODUCT DB:", db_path)

# # @products_bp.route('/products', methods=['GET'])
# # def get_products():
# #     conn = sqlite3.connect(db_path)
# #     cursor = conn.cursor()

# #     cursor.execute("SELECT * FROM products")
# #     rows = cursor.fetchall()

# #     print("Using DB:", db_path)
# #     print("Rows:", rows)

# #     conn.close()

# #     products = []
# #     for row in rows:
# #         products.append({
# #             "id": row[0],
# #             "name": row[1],
# #             "price": row[2],
# #             "description": row[3],
# #             "image": row[4],
# #             "stock": row[5],
# #             "weight": row[6] if len(row) > 6 else None
# #         })

# #     return jsonify(products)


# from flask import Blueprint, jsonify, request
# import sqlite3
# import os

# products_bp = Blueprint('products', __name__)

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# db_path = os.path.join(BASE_DIR, "../database.db")

# @products_bp.route('/products', methods=['GET'])
# def get_products():
#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("SELECT * FROM products")
#     rows = cursor.fetchall()

#     conn.close()

#     products = []
#     for row in rows:
#         products.append({
#             "id": row[0],
#             "name": row[1],
#             "price": row[2],
#             "description": row[3],

#             # ✅ BEST FIX (dynamic URL)
#             "image": request.host_url.rstrip("/") + row[4],

#             "stock": row[5],
#             "weight": row[6] if len(row) > 6 else None
#         })

#     return jsonify(products)

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