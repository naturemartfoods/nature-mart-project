from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models import connect_db
from werkzeug.security import generate_password_hash, check_password_hash

users_bp = Blueprint('users', __name__)


@users_bp.route('/login', methods=['POST'])
def login():
    data     = request.json
    email    = data.get("email")
    password = data.get("password")

    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("SELECT id, name, role FROM users WHERE email=%s AND password=%s", (email, password))
    user = cur.fetchone()
    conn.close()

    if user:
        return jsonify({"id": user[0], "name": user[1], "role": user[2]})
    else:
        return jsonify({"error": "Invalid credentials"}), 401


# ✅ NEW: Get saved address
@users_bp.route('/users/address', methods=['GET'])
@token_required
def get_address():
    user_id = request.user_id
    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("""
        SELECT name, phone, address_line, city, state, pincode
        FROM users WHERE id=%s
    """, (user_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"address": None})

    # Only return address if at least address_line is saved
    if not row[2]:
        return jsonify({"address": None})

    return jsonify({
        "address": {
            "full_name":    row[0] or "",
            "phone":        row[1] or "",
            "address_line": row[2] or "",
            "city":         row[3] or "",
            "state":        row[4] or "",
            "pincode":      row[5] or "",
        }
    })


# ✅ NEW: Save default address
@users_bp.route('/users/address', methods=['PUT'])
@token_required
def save_address():
    user_id = request.user_id
    data    = request.json or {}

    conn = connect_db()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE users
        SET phone=%s, address_line=%s, city=%s, state=%s, pincode=%s
        WHERE id=%s
    """, (
        data.get("phone", ""),
        data.get("address_line", ""),
        data.get("city", ""),
        data.get("state", ""),
        data.get("pincode", ""),
        user_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Address saved successfully"})