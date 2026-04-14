

from flask import Flask, send_from_directory
from flask_cors import CORS
from models import create_tables

import os

from routes.users    import users_bp
from routes.products import products_bp
from routes.cart     import cart_bp
from routes.auth     import auth_bp
from routes.admin    import admin_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True)

# Create / migrate DB tables
create_tables()

# Register blueprints
app.register_blueprint(auth_bp,     url_prefix="/api")
app.register_blueprint(users_bp,    url_prefix="/api")
app.register_blueprint(products_bp, url_prefix="/api")
app.register_blueprint(cart_bp,     url_prefix="/api")
app.register_blueprint(admin_bp,    url_prefix="/api")


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