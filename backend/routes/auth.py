from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import sqlite3
import os
import jwt
import datetime

auth_bp = Blueprint('auth', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(BASE_DIR, "../database.db")
SECRET_KEY = "nature-mart-secret-key-change-in-production"


# ─── JWT Helpers ────────────────────────────────────────────

def generate_token(user_id, role):
    payload = {
        "user_id": user_id,
        "role":    role,
        "exp":     datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = decode_token(token)
            request.user_id = data["user_id"]
            request.user_role = data["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = decode_token(token)
            if data.get("role") != "admin":
                return jsonify({"error": "Admin access required"}), 403
            request.user_id = data["user_id"]
            request.user_role = data["role"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Register ────────────────────────────────────────────────

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    name     = data.get("name", "").strip()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email=?", (email,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Email already registered"}), 409

    hashed = generate_password_hash(password)
    cur.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
        (name, email, hashed)
    )
    conn.commit()
    user_id = cur.lastrowid
    conn.close()

    token = generate_token(user_id, "user")
    return jsonify({
        "message": "Account created successfully",
        "token":   token,
        "user":    {"id": user_id, "name": name, "email": email, "role": "user"}
    }), 201


# ─── Login ───────────────────────────────────────────────────

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data     = request.json
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT id, name, email, password, role, is_active FROM users WHERE email=?", (email,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Invalid email or password"}), 401
    if not row[5]:
        return jsonify({"error": "Account is disabled. Contact admin."}), 403
    if not check_password_hash(row[3], password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(row[0], row[4])
    return jsonify({
        "message": "Login successful",
        "token":   token,
        "user":    {"id": row[0], "name": row[1], "email": row[2], "role": row[4]}
    })


# ─── Get Profile ─────────────────────────────────────────────

@auth_bp.route('/auth/profile', methods=['GET'])
@token_required
def get_profile():
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()
    cur.execute("SELECT id, name, email, role, created_at FROM users WHERE id=?", (request.user_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id":         row[0],
        "name":       row[1],
        "email":      row[2],
        "role":       row[3],
        "created_at": row[4],
    })


# ─── Update Profile ──────────────────────────────────────────

@auth_bp.route('/auth/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.json
    name         = data.get("name", "").strip()
    new_password = data.get("password", "")

    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    if name:
        cur.execute("UPDATE users SET name=? WHERE id=?", (name, request.user_id))

    if new_password:
        if len(new_password) < 6:
            conn.close()
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        hashed = generate_password_hash(new_password)
        cur.execute("UPDATE users SET password=? WHERE id=?", (hashed, request.user_id))

    conn.commit()
    conn.close()
    return jsonify({"message": "Profile updated successfully"})