# from flask import Blueprint, request, jsonify
# import sqlite3
# import os

# users_bp = Blueprint('users', __name__)

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# db_path = os.path.join(BASE_DIR, "../database.db")

# @users_bp.route('/login', methods=['POST'])
# def login():
#     data = request.json
#     email = data.get("email")
#     password = data.get("password")

#     conn = sqlite3.connect(db_path)
#     cursor = conn.cursor()

#     cursor.execute("SELECT id, name, role FROM users WHERE email=? AND password=?", (email, password))
#     user = cursor.fetchone()

#     conn.close()

#     if user:
#         return jsonify({
#             "id": user[0],
#             "name": user[1],
#             "role": user[2]
#         })
#     else:
#         return jsonify({"error": "Invalid credentials"}), 401

from flask import Blueprint, request, jsonify
from models import connect_db

users_bp = Blueprint('users', __name__)


@users_bp.route('/login', methods=['POST'])
def login():
    data     = request.json
    email    = data.get("email")
    password = data.get("password")

    conn   = connect_db()
    cur    = conn.cursor()
    cur.execute("SELECT id, name, role FROM users WHERE email=%s AND password=%s", (email, password))
    user   = cur.fetchone()
    conn.close()

    if user:
        return jsonify({"id": user[0], "name": user[1], "role": user[2]})
    else:
        return jsonify({"error": "Invalid credentials"}), 401