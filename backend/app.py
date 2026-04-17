from flask import Flask, send_from_directory, request
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from models import create_tables
from routes.orders   import orders_bp
from routes.users    import users_bp
from routes.products import products_bp
from routes.cart     import cart_bp
from routes.auth     import auth_bp
from routes.admin    import admin_bp

app = Flask(__name__)

# ✅ UPDATED CORS (FIXED)
CORS(app,
     resources={r"/api/*": {"origins": "*"}},
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# ✅ OPTIONAL (extra safety for preflight)
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return "", 200

# DB init
try:
    create_tables()
except Exception as e:
    print("❌ DB Init Failed:", e)

# Routes
app.register_blueprint(auth_bp,     url_prefix="/api")
app.register_blueprint(users_bp,    url_prefix="/api")
app.register_blueprint(products_bp, url_prefix="/api")
app.register_blueprint(cart_bp,     url_prefix="/api")
app.register_blueprint(admin_bp,    url_prefix="/api")
app.register_blueprint(orders_bp,   url_prefix="/api")

@app.route('/images/<path:filename>')
def get_image(filename):
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(os.path.join(BASE_DIR, "images"), filename)

@app.route("/")
def home():
    return {"message": "Nature Mart API Running 🌿"}

if __name__ == "__main__":
    print("🚀 Starting Flask Server...")
    app.run(debug=True, use_reloader=False)